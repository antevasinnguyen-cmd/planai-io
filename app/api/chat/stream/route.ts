import { NextRequest, NextResponse } from 'next/server'
import { generateStreamingChatResponse } from '@/lib/streamingChat'
import { analyzeUserInput, generateStrategicAssumptions } from '@/lib/openai'
import { getCurrentUser, checkUsageLimits, getUserSubscription, updateProfileFromAnalysis, getUserProfile } from '@/lib/supabase'
import { getChatSystemPrompt } from '@/lib/prompts'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

/**
 * Streaming chat endpoint
 * Returns Server-Sent Events (SSE) stream of chat response
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('API_CHAT_STREAM_REQUEST', {})
    const { message, chatHistory } = await request.json()
    logger.info('API_CHAT_STREAM_PAYLOAD', { messageLength: message?.length, historyLength: chatHistory?.length })

    // Get user (same auth logic as regular chat)
    let user
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        user = sessionData.session.user
      }
    } catch (sessionError) {
      logger.error('API_CHAT_STREAM_SESSION_ERROR', { error: String(sessionError) })
    }

    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const tokenClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        })
        const { data, error } = await tokenClient.auth.getUser()
        if (data?.user) {
          user = data.user
          ;(request as any)._tokenClient = tokenClient
        }
      }
    }

    if (!user) {
      user = await getCurrentUser()
    }

    if (!user) {
      logger.error('API_CHAT_STREAM_UNAUTHORIZED', {})
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check usage limits
    const usageCheck = await checkUsageLimits(user.id, 'chat', request)
    if (!usageCheck.allowed) {
      logger.warn('API_CHAT_STREAM_LIMIT_EXCEEDED', { userId: user.id })
      return NextResponse.json(
        { error: 'Đã đạt giới hạn chat' },
        { status: 429 }
      )
    }

    // Prepare messages
    const messages = [
      ...chatHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    // Build system prompt
    const { data: subData } = await getUserSubscription(user.id)
    const tier = subData?.tier || usageCheck.tier || 'free'
    const basePrompt = getChatSystemPrompt()
    
    let profileBlock = ''
    try {
      const { data: profile } = await getUserProfile(user.id)
      if (profile) {
        const lines: string[] = []
        if (profile.full_name) lines.push(`Họ tên: ${profile.full_name}`)
        if (profile.age) lines.push(`Tuổi: ${profile.age}`)
        if (profile.occupation) lines.push(`Nghề nghiệp: ${profile.occupation}`)
        if (profile.location) lines.push(`Khu vực: ${profile.location}`)
        if (profile.current_income) lines.push(`Thu nhập: ${Number(profile.current_income).toLocaleString('vi-VN')} VNĐ/tháng`)
        if (profile.savings) lines.push(`Tiết kiệm: ${Number(profile.savings).toLocaleString('vi-VN')} VNĐ`)
        if (profile.timeline) lines.push(`Thời gian mục tiêu: ${profile.timeline}`)
        if (profile.financial_goal) lines.push(`Mục tiêu: ${profile.financial_goal}`)
        if (lines.length) {
          profileBlock = `\n\nHỒ SƠ NGƯỜI DÙNG (tóm tắt):\n- ${lines.join('\n- ')}`
        }
      }
    } catch {}

    const tierAddons = tier === 'free'
      ? `\n\nFormatting: Sử dụng **Markdown cơ bản** (tiêu đề ##, bullet, in đậm số liệu). Tập trung gợi ý ngắn gọn, giá trị ngay.`
      : `\n\nFormatting nâng cao: Dùng **Markdown đầy đủ**, thêm bảng tóm tắt, lộ trình, ví dụ và 3 nguồn tham khảo.`

    const customSystemPrompt = `${basePrompt}${profileBlock}${tierAddons}`

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''

          // Stream chunks as they arrive
          await generateStreamingChatResponse(
            [{ role: 'system', content: customSystemPrompt }, ...messages],
            (chunk: string) => {
              fullResponse += chunk
              // Send chunk as SSE event
              const event = `data: ${JSON.stringify({ chunk })}\n\n`
              controller.enqueue(encoder.encode(event))
            }
          )

          // Send completion event
          controller.enqueue(encoder.encode('data: {"done": true}\n\n'))

          // Save messages to DB (fire and forget)
          try {
            const cookieStore = cookies()
            const rhSupabase = createRouteHandlerClient({ cookies: () => cookieStore })
            await rhSupabase
              .from('chat_messages')
              .insert({ user_id: user.id, message, type: 'user', created_at: new Date().toISOString(), source: 'api' })
            await rhSupabase
              .from('chat_messages')
              .insert({ user_id: user.id, message: fullResponse, type: 'ai', created_at: new Date().toISOString(), source: 'api' })
          } catch (e) {
            logger.warn('API_CHAT_STREAM_SAVE_DB_FAILED', { error: String(e) })
          }

          controller.close()
        } catch (error) {
          logger.error('API_CHAT_STREAM_ERROR', { error: String(error) })
          const event = `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`
          controller.enqueue(encoder.encode(event))
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    logger.error('API_CHAT_STREAM_UNHANDLED', { error: String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
