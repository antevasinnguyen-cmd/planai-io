export const runtime = 'nodejs'
export const maxDuration = 300
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentUser, getUserSubscription, checkUsageLimits, getSubscriptionLimits, getTierName, getServerCapsByTier } from '@/lib/supabase'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getPlanPromptV4, getUserContextV4 } from '@/lib/planPromptV4'

/**
 * Background Job API - Starts plan generation in background
 * Returns immediately with job_id, AI processes in background
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('BG_START', {})
    
    // Prefer session-bound client for RLS operations
    const cookieStore = cookies()
    const rhSupabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: authData } = await rhSupabase.auth.getUser()
    const user = authData?.user
    if (!user) {
      logger.warn('BG_UNAUTHORIZED', {})
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planName, goals, collectedInfo, messages } = await request.json()

    // Capture Authorization token (for background processing)
    const authHeader = request.headers.get('Authorization') || ''

    // Fallback: derive plan name and goals if missing from chat_summary
    const chatSummary: string = String(collectedInfo?.chat_summary || '')
    const derivedGoal = (goals && String(goals).trim()) || chatSummary.slice(0, 80).trim() || 'Mục tiêu tài chính cá nhân'
    const finalPlanName = (planName && String(planName).trim()) || (derivedGoal ? `Kế hoạch: ${derivedGoal}` : `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`)
    const finalGoals = derivedGoal

    if (!finalPlanName || !finalGoals) {
      return NextResponse.json(
        { error: 'Missing required fields: planName, goals' },
        { status: 400 }
      )
    }

    // Enforce tier-based plan creation limits
    const planUsage = await checkUsageLimits(user.id, 'plan')
    if (!planUsage.allowed) {
      const tier = planUsage.tier || 'free'
      const limits = getSubscriptionLimits(tier)
      const tierName = getTierName(tier)
      return NextResponse.json(
        {
          error: 'Đã đạt giới hạn kế hoạch',
          message: `Bạn đã tạo ${planUsage.current}/${planUsage.limit} kế hoạch trong tháng của gói ${tierName}. Hãy nâng cấp gói để tiếp tục sử dụng.`,
          usage: {
            current: planUsage.current,
            limit: planUsage.limit,
            tier,
          },
          upgradeRequired: true,
        },
        { status: 429 }
      )
    }

    const { data: subData } = await getUserSubscription(user.id)
    const tier = subData?.tier || 'free'
    const tierLimits = getSubscriptionLimits(tier)
    
    // Build full chat summary from messages array (not just collectedInfo.chat_summary)
    const fullChatSummary = Array.isArray(messages)
      ? messages
          .filter((m: any) => m && m.role === 'user')
          .map((m: any) => m.content || m.message)
          .join('\n')
          .slice(0, 4000)
      : chatSummary.slice(0, 4000)
    
    const enrichedCollectedInfo = { 
      ...(collectedInfo || {}), 
      maxWords: tierLimits.words, 
      tier, 
      chat_summary: fullChatSummary,
      messages: messages // Pass full messages array for AI context
    }

    const caps = getServerCapsByTier(tier)

    // --- Auto-clean stale jobs (>30m) to prevent blocking (increased for longer Free plans) ---
    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
      const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null
      if (admin) {
        await admin
          .from('plan_jobs')
          .update({ status: 'failed', error_message: 'auto-timeout', completed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('status', ['pending', 'processing'])
          .lte('created_at', thirtyMinAgo)
      }
    } catch (cleanErr) {
      logger.warn('BG_CLEAN_STALE_FAIL', { error: String(cleanErr) })
    }
    // Use session-bound client for counting running jobs
    const { count: runningCount, error: countError } = await rhSupabase
      .from('plan_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())

    if (countError) {
      return NextResponse.json(
        { error: 'Không thể kiểm tra số job đang chạy' },
        { status: 500 }
      )
    }

    if ((runningCount || 0) >= caps.maxConcurrentJobs) {
      const tierName = getTierName(tier)
      return NextResponse.json(
        {
          error: 'Quá nhiều tác vụ đang chạy',
          message: `Bạn đang có ${(runningCount || 0)} tác vụ tạo kế hoạch đang chạy. Giới hạn đồng thời của gói ${tierName} là ${caps.maxConcurrentJobs}. Hãy đợi tác vụ hiện tại hoàn tất hoặc nâng cấp gói.`,
          upgradeRequired: true
        },
        { status: 429 }
      )
    }

    // Create job ID
    const jobId = randomUUID()
    logger.info('BG_JOB_CREATED', { jobId, userId: user.id })

    // Insert job record
    const { error: insertError } = await rhSupabase
      .from('plan_jobs')
      .insert({
        id: jobId,
        user_id: user.id,
        plan_name: finalPlanName,
        goals: finalGoals,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      logger.error('BG_DB_INSERT_ERROR', { jobId, userId: user.id, error: String(insertError) })
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    // Start background processing (don't await)
    processJobInBackground(jobId, user.id, finalPlanName, finalGoals, enrichedCollectedInfo, authHeader)
      .catch(error => logger.error('BG_JOB_ASYNC_FAIL', { jobId, error: String(error) }))

    // Return immediately with job_id
    return NextResponse.json(
      { 
        job_id: jobId,
        message: 'Plan generation started. You can close this tab or continue browsing.'
      },
      { status: 202 } // 202 Accepted
    )

  } catch (error) {
    logger.error('BG_UNHANDLED', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Background processing function - runs independently
 */
async function processJobInBackground(
  jobId: string,
  userId: string,
  planName: string,
  goals: string,
  collectedInfo: any,
  authHeader: string
) {
  // Create an authenticated Supabase client using the passed token for RLS-compliant operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {})
  // Admin client (no RLS) for robust job status updates
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const admin = serviceKey ? createClient(supabaseUrl, serviceKey) : null
  
  try {
    logger.info('BG_PROCESS_START', { jobId, userId })

    const getJobStatus = async (): Promise<string | null> => {
      try {
        const client = admin || supabase
        const { data } = await client
          .from('plan_jobs')
          .select('status')
          .eq('id', jobId)
          .maybeSingle()
        return (data as any)?.status || null
      } catch {
        return null
      }
    }

    // If job already cancelled before processing, exit
    const initialStatus = await getJobStatus()
    if (initialStatus === 'cancelled') {
      logger.info('BG_JOB_CANCELLED_EARLY', { jobId })
      return
    }

    // Update status to processing (prefer admin client to avoid RLS/token issues)
    if (admin) {
      await admin
        .from('plan_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId)
    } else {
      await supabase
        .from('plan_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId)
    }

    // Ensure profile exists to satisfy potential FK (plans.user_id -> profiles.id or auth.users.id)
    try {
      // Try with admin client first (most reliable)
      if (admin) {
        const { data: prof } = await admin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!prof) {
          // Profile doesn't exist, create it with required email field
          const { error: insertErr } = await admin
            .from('profiles')
            .insert({ 
              id: userId, 
              email: `user_${userId}@planai.io`, // Fallback email if not available
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (insertErr) {
            logger.warn('BG_ENSURE_PROFILE_INSERT_FAIL', { userId, error: String(insertErr) })
          } else {
            logger.info('BG_ENSURE_PROFILE_CREATED', { userId })
          }
        }
      } else {
        // Fallback to user-scoped client
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!prof) {
          // Profile doesn't exist, create it with required email field
          const { error: insertErr } = await supabase
            .from('profiles')
            .insert({ 
              id: userId, 
              email: `user_${userId}@planai.io`, // Fallback email if not available
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (insertErr) {
            logger.warn('BG_ENSURE_PROFILE_INSERT_FAIL_FALLBACK', { userId, error: String(insertErr) })
          }
        }
      }
    } catch (ensureErr) {
      logger.error('BG_ENSURE_PROFILE_FAIL', { userId, error: String(ensureErr) })
    }

    // Generate plan using V4 one-call JSON with short timeout to avoid long hangs
    logger.info('BG_ONECALL_START', { jobId })
    const tier = String(collectedInfo?.tier || 'free')
    const limits = getSubscriptionLimits(tier)
    const constraints = {
      max_words: limits.words || 1500,
      max_mermaid: tier === 'free' ? 0 : tier === 'basic' ? 0 : 0,
      max_tables: 0,
      min_resources: tier === 'free' ? 5 : tier === 'basic' ? 25 : tier === 'pro' ? 45 : 60,
      max_resources: tier === 'free' ? 15 : tier === 'basic' ? 35 : tier === 'pro' ? 60 : 80,
      resources_policy: 'gpt_only'
    }

    const systemPrompt = getPlanPromptV4(tier, constraints, collectedInfo)
    const userContext = getUserContextV4(collectedInfo)
    const userTimeline = collectedInfo?.timeline || '12 tháng'
    const forceTextOnly = `\n\n⚠️⚠️⚠️ CHÚ Ý QUAN TRỌNG NHẤT ⚠️⚠️⚠️\n1. TUYỆT ĐỐI KHÔNG dùng bảng Markdown\n2. TUYỆT ĐỐI KHÔNG dùng Mermaid/sơ đồ\n3. Dùng thời gian chung chung: "tháng thứ nhất", "quý thứ nhất", v.v.\n4. Nội dung là văn bản thuần với Markdown cơ bản\n5. KHÔNG có phần "Xuất Dữ Liệu Bảng"\n6. FREE = đúng 9 phần + CTA nâng cấp ở cuối; PREMIUM = đúng 24 phần\n`
    const userPrompt = `${userContext}\n\n🎯 YÊU CẦU CỤ THỂ:\n${goals}\n\n⏰ TIMELINE: ${userTimeline}\n\n📊 TIER: ${tier.toUpperCase()}\n${forceTextOnly}`

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Dynamic timeout by tier (free: 60s, paid: 300s)
    const controller = new AbortController()
    const tierTimeoutMs = tier === 'free' ? 60000 : 300000
    const timeoutId = setTimeout(() => controller.abort(), tierTimeoutMs)
    let raw = '{}'
    try {
      logger.info('BG_OPENAI_CALL', { jobId, model: 'gpt-4o-mini' })
      const completion = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: tier === 'free' ? 0.5 : 0.3,
          max_tokens: Math.min(2500, Math.ceil((constraints.max_words || 1500) * 1.3)),
          messages: [
            { role: 'system', content: String(systemPrompt) },
            { role: 'user', content: userPrompt.slice(0, 8000) }
          ]
        },
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)
      raw = completion.choices?.[0]?.message?.content || '{}'
      logger.info('BG_OPENAI_DONE', { jobId, size: raw.length })
    } catch (e: any) {
      clearTimeout(timeoutId)
      logger.warn('BG_OPENAI_FAILED', { jobId, error: String(e?.message || e) })
      // Fallback to Claude 3 Opus
      try {
        const Anthropic = require('@anthropic-ai/sdk').default
        const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const claudeResp = await claude.messages.create({
          model: 'claude-3-5-sonnet-20241022', // Cập nhật model mới nhất
          max_tokens: Math.min(3000, Math.ceil((constraints.max_words || 1500) * 1.5)),
          messages: [
            { role: 'user', content: `${String(systemPrompt)}\n\n${userPrompt.slice(0, 8000)}` }
          ]
        })
        raw = claudeResp.content?.[0]?.type === 'text' ? claudeResp.content[0].text : '{}'
        logger.info('BG_CLAUDE_DONE', { jobId, size: raw.length })
      } catch (fallbackErr: any) {
        logger.error('BG_CLAUDE_FAILED', { jobId, error: String(fallbackErr?.message || fallbackErr) })
        throw new Error(`AI call failed (GPT then Claude): ${fallbackErr?.message || String(fallbackErr)}`)
      }
    }

    // Parse and sanitize
    let parsed: any
    try { parsed = JSON.parse(raw) } catch { parsed = {} }
    let content_md = String(parsed?.content_markdown || '')
    const title = typeof parsed?.title === 'string' && parsed.title.trim().length ? parsed.title : (planName || 'Kế hoạch tài chính')

    content_md = content_md
      .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
      .replace(/```mermaid[\s\S]*?```/g, '')
      .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
      .replace(/#+\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')

    if (tier === 'free' && !content_md.includes('NÂNG CẤP GÓI TRẢ PHÍ NGAY')) {
      content_md += `\n\n**🏁 NÂNG CẤP GÓI TRẢ PHÍ NGAY!**\nBản kế hoạch FREE này chỉ là khởi đầu. Với gói Premium, bạn sẽ nhận được:\n✅ 24 phần phân tích chuyên sâu (gấp 3 lần)\n✅ Google Sheets tự động với 7 tabs tracking\n✅ Phân tích tử vi tài chính & thần số học\n✅ 3-5 mô hình kinh doanh cá nhân hóa\n✅ 50+ tài liệu học tập premium\n✅ Kế hoạch Ngày/Tuần/Tháng/Quý/Năm chi tiết\n✅ Dự báo 3 kịch bản & chiến lược rủi ro\n👉 Nâng cấp tại: https://planai.io.vn/pricing\n`
    }

    // Optional QA validator pass (improve coherence and fill gaps). Enabled for paid tiers by default.
    try {
      const enableQa = process.env.ENABLE_QA_VALIDATOR !== 'false'
      if (enableQa) {
        const qaController = new AbortController()
        const qaTimeoutMs = Math.min(180000, Math.max(60000, tierTimeoutMs - 10000)) // leave headroom
        const qaTimeout = setTimeout(() => qaController.abort(), qaTimeoutMs)
        const qaPrompt = [
          'Bạn là Trưởng biên tập biên soạn ebook tài chính. Hãy rà soát và CHỈ TRẢ VỀ duy nhất nội dung Markdown đã được cải thiện.',
          'YÊU CẦU CHẤT LƯỢNG:',
          '- Giữ nguyên cấu trúc bắt buộc (FREE=9 phần, PREMIUM=24 phần).',
          '- Loại mọi bảng/Mermaid. Chỉ dùng tiêu đề, danh sách, đoạn văn.',
          '- Check chéo số liệu và logic, loại placeholder, bổ sung thiếu sót.',
          '- Dùng mốc thời gian chung chung: "tháng thứ nhất", "quý thứ nhất", ...',
          '',
          'THÔNG TIN NGƯỜI DÙNG (rút gọn):',
          userContext.slice(0, 1500),
          '',
          'NỘI DUNG GỐC CẦN SỬA:',
          content_md.slice(0, 24000)
        ].join('\n')
        const qa = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          max_tokens: Math.min(1800, Math.ceil((constraints.max_words || 1500) * 1.4)),
          messages: [
            { role: 'system', content: 'Bạn là biên tập viên nghiêm khắc, trả về duy nhất nội dung Markdown hợp lệ, không thêm text ngoài lề.' },
            { role: 'user', content: qaPrompt }
          ]
        }, { signal: qaController.signal })
        clearTimeout(qaTimeout)
        const improved = qa.choices?.[0]?.message?.content || ''
        if (improved && improved.length > 100) {
          content_md = String(improved)
            .replace(/\|[^\n]*\|[^\n]*\|[\s\S]*?(?=\n\s*\n|$)/g, '')
            .replace(/```mermaid[\s\S]*?```/g, '')
            .replace(/#+\s*Xuất Dữ Liệu Bảng[\s\S]*?(#+|$)/i, '$1')
            .replace(/#+\s*$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
        }
      }
    } catch (qaErr) {
      logger.warn('BG_QA_PASS_SKIPPED', { jobId, error: String(qaErr) })
    }

    // Save plan (RLS first, fallback admin)
    let planData: any = null
    let planError: any = null
    {
      const resp = await supabase
        .from('plans')
        .insert({
          user_id: userId,
          title,
          goal: goals,
          content: content_md,
          status: 'completed',
          word_count: content_md.split(/\s+/).length,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      planData = resp.data
      planError = resp.error
    }
    if (planError && admin) {
      const resp = await admin
        .from('plans')
        .insert({
          user_id: userId,
          title,
          goal: goals,
          content: content_md,
          status: 'completed',
          word_count: content_md.split(/\s+/).length,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      planData = resp.data
      planError = resp.error
    }
    if (planError) {
      const isFK = String(planError.message || '').toLowerCase().includes('foreign key')
      if (isFK) {
        const client = admin || supabase
        await client.from('profiles').upsert({ id: userId, created_at: new Date().toISOString() })
        const retry = await (admin || supabase)
          .from('plans')
          .insert({
            user_id: userId,
            title,
            goal: goals,
            content: content_md,
            status: 'completed',
            word_count: content_md.split(/\s+/).length,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        if (retry.error) throw new Error(`Failed to save plan (retry): ${retry.error.message}`)
        planData = retry.data
      } else {
        throw new Error(`Failed to save plan: ${planError.message}`)
      }
    }

    const updatePayload = { status: 'completed', plan_id: planData.id, completed_at: new Date().toISOString() }
    let statusUpdateError: any = null
    if (admin) {
      const { error: updateErr } = await admin.from('plan_jobs').update(updatePayload).eq('id', jobId)
      statusUpdateError = updateErr
    } else {
      const { error: updateErr } = await supabase.from('plan_jobs').update(updatePayload).eq('id', jobId)
      statusUpdateError = updateErr
    }
    if (statusUpdateError) {
      logger.error('BG_JOB_STATUS_UPDATE_FAILED', { jobId, error: String(statusUpdateError) })
      throw new Error(`Failed to update job status: ${statusUpdateError.message}`)
    }
    logger.info('BG_JOB_COMPLETED', { jobId, planId: planData.id })
    return

  } catch (error: any) {
    logger.error('BG_JOB_FAILED', { jobId, error: error?.message || String(error) })

    // Update job with error (prefer admin to guarantee write)
    const errMsg = (error?.message || 'Unknown error').slice(0, 500)
    if (admin) {
      await admin
        .from('plan_jobs')
        .update({ status: 'failed', error_message: errMsg, completed_at: new Date().toISOString() })
        .eq('id', jobId)
    } else {
      await supabase
        .from('plan_jobs')
        .update({ status: 'failed', error_message: errMsg, completed_at: new Date().toISOString() })
        .eq('id', jobId)
    }
  }
}
