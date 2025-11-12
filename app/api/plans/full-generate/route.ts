import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { getUserSubscription, getSubscriptionLimits } from '@/lib/supabase'
import { exportPlanToGoogleSheets } from '@/lib/googleSheets'
import { exportFinancialPlanToNotion, getOrCreateFinancialPlanDatabase } from '@/lib/notion'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getPlanPromptV2, getUserContextPrompt } from '@/lib/planPromptV2'

export const dynamic = 'force-dynamic'

// Lightweight validator to avoid adding new deps
function isNonEmptyString(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out: any = {}
  for (const k of keys) out[k] = (obj as any)?.[k]
  return out
}

// Sanitize common Mermaid and Markdown issues the model may produce
function sanitizeMermaid(code: string): string {
  const lines = String(code || '')
    .replace(/\r/g, '')
    .replace(/\t/g, '  ')
    .split(/\n/)
  if (!lines.length) return 'mindmap\n  root\n    Năm 1\n      Quý 1'
  const first = lines[0].trim().toLowerCase()
  if (first.startsWith('mindmap')) {
    const out: string[] = ['mindmap']
    for (let i = 1; i < lines.length; i++) {
      let t = lines[i]
      // remove bullets and list markers
      t = t.replace(/^\s*[\-\*•]+\s*/, '  ')
      // remove flowchart shapes which are invalid in mindmap
      t = t.replace(/[()\[\]{}]/g, '')
      // collapse multiple spaces
      t = t.replace(/\s+$/g, '')
      out.push(t)
    }
    if (out.length === 1) {
      out.push('  root')
      out.push('    Năm 1')
      out.push('      Quý 1')
    }
    return out.join('\n')
  }
  return lines.join('\n')
}

function sanitizeMarkdownTable(tableMd: string): string {
  const lines = String(tableMd || '').trim().split(/\n/)
  if (lines.length < 2) return tableMd
  const header = lines[0]
  const hasSep = /^\s*\|?\s*:?\-/.test(lines[1]) && lines[1].includes('|')
  if (!hasSep && header.includes('|')) {
    const colCount = header.split('|').filter(Boolean).length
    const sep = Array.from({ length: colCount }, () => '---').join(' | ')
    lines.splice(1, 0, `| ${sep} |`)
  }
  return lines.join('\n')
}

function sanitizeInlineTablesInContent(md: string): string {
  const lines = String(md || '').split(/\n/)
  for (let i = 0; i < lines.length - 1; i++) {
    const header = lines[i]
    const next = lines[i + 1]
    if (/^\s*\|.*\|\s*$/.test(header) && !/^\s*\|?\s*:?-{3,}/.test(next)) {
      const colCount = header.split('|').filter(Boolean).length
      const sep = Array.from({ length: colCount }, () => '---').join(' | ')
      lines.splice(i + 1, 0, `| ${sep} |`)
      i++
    }
  }
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    logger.info('ONECALL_START')
    const body = await req.json()
    const { planName, goals, collectedInfo = {} } = body || {}

    // Auth via route handler client (RLS-safe)
    const rh = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: auth } = await rh.auth.getUser()
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = auth.user.id

    // Tier & limits
    const { data: sub } = await getUserSubscription(userId)
    const tier = sub?.tier || 'free'
    const limits = getSubscriptionLimits(tier)

    // One-call JSON schema (prompt fragment)
    const constraints = {
      max_words: limits.words || 1500,
      max_mermaid: tier === 'free' ? 2 : tier === 'basic' ? 3 : tier === 'pro' ? 4 : 6,
      max_tables: tier === 'free' ? 8 : tier === 'basic' ? 10 : tier === 'pro' ? 12 : 15,
      min_resources: tier === 'free' ? 11 : tier === 'basic' ? 25 : tier === 'pro' ? 45 : 60,
      max_resources: tier === 'free' ? 15 : tier === 'basic' ? 35 : tier === 'pro' ? 60 : 80,
      resources_policy: 'gpt_only'
    }

    // Use optimized V2 prompt for better quality and performance
    const systemPrompt = getPlanPromptV2(tier, constraints)
    const userContext = getUserContextPrompt(collectedInfo)
    
    // Old long prompt array removed - was causing timeout issues
    /* const systemPrompt = [
      'Schema keys: title, summary, tier, content_markdown, mermaid_blocks[], tables_md[], sheets_spec{enabled,title,sheets[{name,headers[],rows[][]}]}, notion_spec{enabled,title,cover_url,children[]}, resources[{type,title,url,locale,reason,min_views}], constraints{max_words,max_mermaid,max_tables,resources_policy}.',
      'Giọng văn: bạn thân 10 năm, thông thái, chuyên gia tài chính, thân thiện, dùng chính câu nói/cách xưng hô của user.',
      'Mọi hành động phải khả thi trong 24h tới (ưu tiên hành động nhỏ, rõ người thực hiện, có tiêu chí hoàn thành & link học).',
      'content_markdown phải là toàn bộ bản kế hoạch (Markdown GFM); KHÔNG nhúng Mermaid trong phần này (để riêng ở mermaid_blocks). Bảng Markdown phải có format chuẩn và KHÔNG BAO GIỜ dùng "---" hay "..." như placeholder trong ô dữ liệu.',
      'mermaid_blocks: chỉ code Mermaid HỢP LỆ (flowchart|sequence|gantt|mindmap|timeline|graph). Với mindmap: TUYỆT ĐỐI KHÔNG dùng ký hiệu hình dạng () [] {}. Mẫu đúng:',
      '"""MERMAID\nmindmap\n  root\n    Năm 1\n      Quý 1\n        Tháng 1\n          Tuần 1\n  Năm 2\n"""',
      'BẮT BUỘC có ít nhất 1 mindmap roadmap tổng quan và 1 timeline chi tiết; tối đa theo max_mermaid.',
      'tables_md: bảng Markdown thuần với format chuẩn, MỖI Ô PHẢI CÓ DỮ LIỆU THỰC, không được để trống hay dùng "---"; tối đa theo max_tables.',
      'sheets_spec: nếu enabled, định nghĩa các sheet để tạo Google Sheets.',
      'resources: PHẢI CÓ TỐI THIỂU min_resources và TỐI ĐA max_resources link chất lượng cao, ưu tiên Việt Nam; YouTube > 50k views; link công khai mở được ngay. CHỈ DÙNG LINK TỪ DATABASE NÀY (hoặc link uy tín khác nếu không có): finance_personal, investing, business_startup, skills_soft, tech_digital, sales_marketing, accounting_tax, psychology_mindset, health_productivity. Mỗi link phải click vào được ngay, không 404. Mỗi resource phải có: type, title (cụ thể, cá nhân hóa), url (thực), locale (vi/en), reason (tại sao phù hợp với user này).',
      '',
      'CẤU TRÚC THEO TIER:',
      '- Nếu tier là gói TRẢ PHÍ (basic|pro|pro_max): content_markdown phải bao phủ các phần (không cần đánh số trong tiêu đề):',
      '  Tiêu đề (cá nhân hóa với tên + mục tiêu cụ thể); Tổng quan (mục tiêu + hồ sơ cá nhân & bối cảnh chi tiết);',
      '  SWOT cá nhân (Việt Nam - phân tích sâu dựa trên nghề nghiệp, thu nhập, vị trí địa lý, xu hướng thị trường 2025);',
      '  Mục tiêu SMART (cụ thể số liệu, deadline rõ ràng, KPI đo được);',
      '  Phân tích mục tiêu tài chính & chiến lược tổng quan (tính toán cụ thể: thu nhập hiện tại -> mục tiêu, gap analysis, ROI dự kiến);',
      '  Sơ đồ lộ trình/mindmap (đặt code vào mermaid_blocks - phải có milestone rõ ràng);',
      '  Đề xuất chiến lược cụ thể + đi sâu chi tiết (từng bước, từng tháng, từng hành động, budget cần thiết, rủi ro & cách xử lý);',
      '  Những việc cần làm để đạt mục tiêu (chia nhỏ theo tuần, ngày, giờ - mỗi việc có deadline + người thực hiện + tiêu chí hoàn thành);',
      '  Yếu tố khách quan/chủ quan (phân tích sâu: kinh tế VN 2025, ngành nghề, cạnh tranh, tâm lý, kỹ năng hiện có vs cần có);',
      '  Kỹ năng/kinh nghiệm cần có (liệt kê chi tiết, ưu tiên, thời gian học, nguồn học tốt nhất, cách thực hành);',
      '  Kế hoạch tích luỹ tài sản (số tiền cụ thể mỗi tháng, % thu nhập, công cụ tiết kiệm, lãi suất dự kiến);',
      '  Kế hoạch đầu tư & quản trị rủi ro (phân bổ tài sản, % mỗi kênh, stop-loss, diversification, insurance);',
      '  Mô hình kinh doanh phù hợp + các bước cụ thể (nếu có - phân tích chi tiết: market size, target customer, revenue model, cost structure, go-to-market);',
      '  Kế hoạch chi tiết theo thời gian mục tiêu (PHẢI KHỚP CHÍNH XÁC với timeline của user - nếu user mục tiêu 3 năm thì phải chia đủ 36 tháng, nếu 2 năm thì 24 tháng, mỗi giai đoạn có mục tiêu số cụ thể, KPI đo được, checkpoint rõ ràng);',
      '  Checklist hành động theo tuần/tháng/năm (BẮT BUỘC phải có đủ 3 bảng riêng biệt: Checklist Tuần 1-4, Checklist Tháng 1-12, Checklist Năm 1-X theo timeline user, mỗi bảng có cột Thời gian | Hành động cụ thể | KPI | Link học | Ghi chú với DỮ LIỆU THỰC 100%);',
      '  Tài liệu học & kỹ năng (x giờ/tuần, liệt kê ĐẦY ĐỦ min_resources kỹ năng -> link tài liệu tốt nhất từ database, lý do chọn, cách áp dụng);',
      '  3 kịch bản (Tệ nhất/Trung bình/Tốt nhất - mỗi kịch bản có số liệu cụ thể, xác suất, impact) + chiến lược giảm rủi ro chi tiết;',
      '  Phân tích tử vi/chỉ số đường đời/thần số học theo ngày sinh (nhấn mạnh tài chính, sự nghiệp, năm 2025) + hướng đi phù hợp cụ thể;',
      '  Tóm tắt & kết luận hành động (3-5 việc quan trọng nhất phải làm ngay tuần này); Hướng dẫn sử dụng kế hoạch tốt nhất (cách tracking, review, adjust);',
      '  Kết luận & động lực hành động ngay (gọi tên user, nhắc lại mục tiêu, deadline, first action trong 24h).',
      '  Đồng thời, đề xuất sheets_spec với cấu trúc các tab sau: Dashboard, Roadmap, Checklist (checkbox), TietKiem, TangThuNhap, BusinessMetrics (MRR, Churn, CAC, LTV), KyNang_TaiLieu.',
      '- Nếu tier là FREE: tối đa 3.000 từ (tuỳ vào độ phức tạp thông tin), WOW content để user nâng cấp. BỐ CỤC 15 MỤC BẮT BUỘC (KHÔNG THIẾU, KHÔNG THỪA, KHÔNG "..."). PHẢI CÓ THÊM MỤC 0: "Kiểm Tra Dữ Liệu" ở đầu bản kế hoạch (xác nhận CURRENT STATE vs GOALS, GAP, timeline). Sau đó là: Tiêu đề + Tóm tắt + SWOT + Phân tích mục tiêu + Phân tích yếu tố + Phân tích kỹ năng + Mindmap lộ trình + Lộ trình + Đề xuất hành động + Checklist tháng + Kế hoạch tiết kiệm + Kế hoạch đầu tư + Tài liệu (11+) + Kết luận:',
      '  1. Tiêu đề: "KẾ HOẠCH TÀI CHÍNH CÁ NHÂN HOÁ MIỄN PHÍ - {mục tiêu cụ thể} trong {timeline} - Dành cho {tên user}".',
      '  2. Tóm tắt thông tin (bullet list): • Họ tên: {name} • Ngày sinh: {dob} • Tuổi: {age} • Nơi ở: {location} • Thu nhập hiện tại: {income}/tháng • Tiết kiệm hiện có: {savings} • Nghề hiện tại: {job} • Nghề trước đây: {prev_job} • Kỹ năng: {skills} • Mục tiêu: {goal} • Timeline: {timeline} • Sẵn sàng: {readiness}/10.',
      '  3. Phân tích SWOT (bảng 4 cột ĐẦY ĐỦ dữ liệu VN 11/2025): | Điểm mạnh | Điểm yếu | Cơ hội | Thách thức | - KHÔNG "---", KHÔNG "...".',
      '  4. Phân tích mục tiêu tài chính (400 từ): tính toán chi tiết (tổng mục tiêu, chia theo từng hạng mục, tính toán tiền cần tiết kiệm/tháng), gap analysis, ROI cụ thể.',
      '  5. Phân tích yếu tố khách quan & chủ quan (300 từ): kinh tế VN, ngành, cạnh tranh, tâm lý.',
      '  6. Phân tích kỹ năng cần có (250 từ): liệt kê chi tiết, ưu tiên, thời gian học.',
      '  7. Mindmap lộ trình tổng quan (mermaid mindmap - BẮT BUỘC): root là mục tiêu cuối, branches là milestone năm/quý, sub-branches là hành động cụ thể.',
      '  8. Lộ trình theo timeline user (Ngày-Tuần-Tháng-Năm): văn bản chi tiết + link Google Sheet template.',
      '  9. Đề xuất hành động (150 từ): 3-5 hành động cụ thể, khả thi trong 24h.',
      '  10. Checklist hành động tháng (bảng Markdown chuẩn - KHÔNG "..."):',
      '      Checklist Tháng: | Tháng | Hành động cụ thể | Mục tiêu | Link tài liệu tham khảo | - PHẢI CÓ ĐỦ 12 HÀNG (Tháng 1 đến Tháng 12), mỗi hàng có dữ liệu thực, cụ thể, không để trống. Hành động phải chi tiết và bám sát mục tiêu tài chính của user.',
      '  11. Kế hoạch tiết kiệm: | Năm | Số tiền tiết kiệm/tháng | Tổng năm | Nguồn tiền (chi tiết) | - PHẢI tính toán CHÍNH XÁC 100%. CÔNG THỨC: Số tiền/tháng = (Tổng mục tiêu VNĐ) ÷ (Số tháng timeline). VD: Mục tiêu 12.7 tỷ trong 70 tháng → 12.7 tỷ ÷ 70 = 181.4 triệu/tháng. KIỂM TRA: 181.4 triệu × 70 tháng = 12.7 tỷ ✓. Chia theo năm: Năm 1 (12 tháng) = 181.4M × 12 = 2.177 tỷ. Nguồn tiền phải bám sát thông tin user chia sẻ (lương, freelance, kinh doanh, đầu tư, etc.).',
      '  12. Kế hoạch đầu tư: | Hạng mục đầu tư | Số tiền/tháng | Mục đích | Rủi ro | Kỳ vọng lợi nhuận | - PHẢI CÓ TỐI THIỂU 3-5 HÀNG. Bao gồm: Đầu tư kiến thức/kỹ năng (x VNĐ/tháng), Đầu tư quỹ trái phiếu an toàn (x VNĐ/tháng), Đầu tư vào kinh doanh/side business (x VNĐ/tháng). Mỗi hàng phải có số tiền cụ thể, mục đích rõ ràng, rủi ro và kỳ vọng lợi nhuận cụ thể.',
      '  13. Tài liệu học tập (PHẢI CÓ ĐỦ TỐI THIỂU 11 TÀI LIỆU): | Tên tài liệu | Loại | Link | Ngôn ngữ | Mô tả chi tiết kiến thức user sẽ học được và giúp gì cho mục tiêu tài chính | - Ưu tiên Coursera, Khan Academy, edX, Roadmap.sh, YouTube (>50k views), LinkedIn Learning, Skillshare, Google Books, TED, HubSpot, Ahrefs. Link PHẢI dẫn trực tiếp tới khoá học/video cụ thể, KHÔNG dùng link tìm kiếm chung hoặc homepage. Mô tả chi tiết: "Khoá học này dạy về [chủ đề cụ thể] giúp user [lợi ích cụ thể cho mục tiêu tài chính của user]".',
      '  14. Kết luận + CTA nâng cấp: "Đây là bản kế hoạch cơ bản cho gói Free. Gói trả phí có bản kế hoạch chi tiết gấp nhiều lần với phân tích sâu hơn, nhiều checklist (tuần/tháng/năm), phân tích tử vi kết hợp, 40+ tài liệu chuyên sâu, và nhiều tính năng khác. Hãy nâng cấp để có kế hoạch hoàn chỉnh nhất!".',
      '',
      'Lưu ý QUAN TRỌNG:',
      '- TUYỆT ĐỐI KHÔNG dùng "---", "...", "TBD", "N/A" hay bất kỳ placeholder nào. MỖI Ô BẢNG phải có dữ liệu thực, cụ thể, cá nhân hóa.',
      '- TÍNH TOÁN TÀI CHÍNH PHẢI CHÍNH XÁC 100%: Ví dụ mục tiêu 2.5 tỷ nhà + 700 triệu xe + 10 tỷ tiết kiệm = 13.2 tỷ trong 36 tháng → cần tiết kiệm 366 triệu/tháng (không phải 3 triệu). KIỂM TRA LẠI MỌI PHÉP TÍNH.',
      '- Lộ trình PHẢI KHỚP timeline của user: nếu user mục tiêu 3 năm thì phải có đủ 36 milestone tháng, nếu 18 tháng thì có đủ 18 milestone.',
      '- Bảng tiết kiệm: Tính chính xác số tiền cần thiết mỗi tháng = (Tổng mục tiêu VNĐ) ÷ (Số tháng timeline). VD: 13.2 tỷ ÷ 36 tháng = 366.7 triệu/tháng.',
      '- Thu nhập hiện tại vs mục tiêu: Nếu cần 366M/tháng mà chỉ có 50M thu nhập → cần tăng thu nhập 7.3 lần, đề xuất chiến lược CỤ THỂ.',
      '- Checklist phải có đủ 3 bảng riêng: Tuần (4 tuần), Tháng (theo timeline), Năm (theo timeline).',
      '- Chiến lược tăng thu nhập phải CỤ THỂ: tên chiến lược, cách thực hiện, timeline, ROI dự kiến, rủi ro.',
      '- Resources: Ưu tiên tiếng Anh từ Coursera, Khan Academy, edX, Roadmap.sh, YouTube, LinkedIn Learning, Skillshare, Google Books, TED, HubSpot, Ahrefs. Cũng có thể dùng nguồn VN uy tín. TUYỆT ĐỐI không link lỗi.',
      '- Roadmap/Mindmap: Sử dụng mermaid mindmap hoặc timeline để hiển thị lộ trình chi tiết (tham khảo roadmap.sh). Với mindmap: KHÔNG dùng kí hiệu hình dạng, chỉ dùng các dòng thụt lề hai khoảng. Ví dụ hợp lệ ở trên.',
      '- Tránh lý thuyết suông; viết cụ thể, áp dụng vào hoàn cảnh của user Việt Nam.',
      '- Bảng Markdown phải format chuẩn: | A | B | C | \n |---|---|---| \n | data1 | data2 | data3 |',
      '',
      '⚠️ VALIDATION TOÁN HỌC (BẮT BUỘC KIỂM TRA):',
      '1. TÍNH TỔNG MỤC TIÊU: Cộng tất cả mục tiêu con (nhà, xe, tiết kiệm, etc.) = Tổng VNĐ',
      '2. TÍNH TIỀN/THÁNG: Tổng VNĐ ÷ Số tháng timeline = Tiền/tháng',
      '3. KIỂM TRA NGƯỢC: Tiền/tháng × Số tháng = Tổng VNĐ (PHẢI BẰNG NHAU)',
      '4. NẾU SAI: Recalculate lại cho đến khi đúng',
      '5. VÍ DỤ ĐÚNG: Mục tiêu 12.7 tỷ, 70 tháng → 12.7T ÷ 70 = 181.4M/tháng → Check: 181.4M × 70 = 12.7T ✓',
      '6. VÍ DỤ SAI: Mục tiêu 12.7 tỷ, 70 tháng nhưng tính 15M/tháng → 15M × 70 = 1.05T ≠ 12.7T ✗ (SAI LẦM NGHIÊM TRỌNG)',
      '',
      '- Trả về JSON HỢP LỆ duy nhất.'
    ].join('\n') */

    // Extract timeline for personalized planning
    const userTimeline = collectedInfo?.timeline || '12 tháng'
    const timelineNote = `TIMELINE USER: ${userTimeline} - Lộ trình và checklist PHẢI KHỚP chính xác với thời gian này.`

    const userPrompt = `
${userContext}

🎯 YÊU CẦU CỤ THỂ:
${goals || collectedInfo?.goal || 'Lập kế hoạch tài chính tổng thể'}

⏰ TIMELINE: ${userTimeline}

📊 TIER: ${tier.toUpperCase()}
`

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // All tiers use GPT-4 Turbo (unified model strategy)
    const model = 'gpt-4-turbo'
    const temperature = tier === 'free' ? 0.5 : 0.3

    // systemPrompt is now a string from V2
    const systemPromptStr = String(systemPrompt)
    
    let raw: string = '{}'
    
    // Try GPT-4 Turbo first with timeout
    try {
      logger.info('ONECALL_TRY_GPT4_TURBO', {})
      
      // Add 30-second timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        logger.warn('ONECALL_GPT4_TIMEOUT', { timeout: '30s' })
      }, 30000) // 30 seconds timeout
      
      const completion = await openai.chat.completions.create(
        {
          model,
          response_format: { type: 'json_object' },
          temperature,
          // Reduce max_tokens to prevent timeout (was 4096, causing 60+ min hangs)
          max_tokens: Math.min(3000, Math.ceil((constraints.max_words || 1500) * 1.5)),
          messages: [
            { role: 'system', content: systemPromptStr },
            { role: 'user', content: userPrompt.slice(0, 8000) } // Reduced from 12000
          ]
        },
        {
          signal: controller.signal
        }
      )
      
      clearTimeout(timeoutId)
      raw = completion.choices?.[0]?.message?.content || '{}'
      logger.info('ONECALL_OPENAI_DONE', { size: raw.length })
    } catch (gptError) {
      logger.error('ONECALL_GPT4_FAILED', { error: String(gptError) })
      
      // Fallback to Claude 3 Opus
      try {
        logger.info('ONECALL_FALLBACK_TO_CLAUDE', {})
        const Anthropic = require('@anthropic-ai/sdk').default
        const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        
        const claudeCompletion = await claude.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: Math.min(4096, Math.ceil((constraints.max_words || 1500) * 2.0)),
          messages: [
            {
              role: 'user',
              content: `${systemPromptStr}\n\n${JSON.stringify(userPrompt).slice(0, 12000)}`
            }
          ]
        })
        
        raw = claudeCompletion.content?.[0]?.type === 'text' ? claudeCompletion.content[0].text : '{}'
        logger.info('ONECALL_CLAUDE_DONE', { size: raw.length })
      } catch (claudeError) {
        logger.error('ONECALL_CLAUDE_FAILED', { error: String(claudeError) })
        return NextResponse.json({ 
          error: 'Plan generation failed',
          message: 'Cả GPT-4 Turbo và Claude 3 Opus đều không thể tạo kế hoạch. Vui lòng thử lại sau.'
        }, { status: 500 })
      }
    }

    // Zod schema for strict validation
    const LLMResponseSchema = z.object({
      title: z.string().min(1).max(200),
      summary: z.string().optional(),
      tier: z.string().optional(),
      content_markdown: z.string().min(1),
      mermaid_blocks: z.array(z.string()).default([]),
      tables_md: z.array(z.string()).default([]),
      sheets_spec: z.object({
        enabled: z.boolean().optional(),
        title: z.string().optional(),
        sheets: z.array(z.object({
          name: z.string(),
          headers: z.array(z.string()).optional(),
          rows: z.array(z.array(z.any())).optional()
        })).optional()
      }).optional(),
      notion_spec: z.object({
        enabled: z.boolean().optional(),
        title: z.string().optional(),
        cover_url: z.string().url().optional(),
        children: z.array(z.any()).optional()
      }).optional(),
      resources: z.array(z.object({
        type: z.string().optional(),
        title: z.string().min(1),
        url: z.string().url(),
        locale: z.string().optional(),
        reason: z.string().optional(),
        min_views: z.number().optional(),
      })).default([]),
      constraints: z.any().optional()
    })

    let parsedRaw: any
    try { parsedRaw = JSON.parse(raw) } catch (e) {
      logger.warn('ONECALL_JSON_PARSE_FAIL', { error: String(e) })
      parsedRaw = {}
    }
    const safe = LLMResponseSchema.safeParse(parsedRaw)
    if (!safe.success) {
      logger.warn('ONECALL_SCHEMA_INVALID', { issues: safe.error.issues?.slice(0, 5) })
    }
    const parsed = safe.success ? safe.data : (parsedRaw || {})

    let content_md = String((parsed as any)?.content_markdown || '')
    const title = isNonEmptyString((parsed as any)?.title) ? (parsed as any).title : String(planName || 'Kế hoạch tài chính')
    let mermaid_blocks: string[] = Array.isArray((parsed as any)?.mermaid_blocks) ? (parsed as any).mermaid_blocks : []
    let tables_md: string[] = Array.isArray((parsed as any)?.tables_md) ? (parsed as any).tables_md : []

    // Extract any fenced mermaid code blocks accidentally placed inside content_markdown
    try {
      const mermaidFence = /```mermaid\n([\s\S]*?)\n```/g
      const extracted: string[] = []
      content_md = content_md.replace(mermaidFence, (_m, code) => {
        extracted.push(String(code || ''))
        return ''
      })
      if (extracted.length) {
        mermaid_blocks = mermaid_blocks.concat(extracted)
      }
    } catch {}

    // Fix inline tables without separator lines in content
    content_md = sanitizeInlineTablesInContent(content_md)

    // Sanitize Mermaid and tables for better rendering robustness
    mermaid_blocks = mermaid_blocks.map(sanitizeMermaid)
    tables_md = tables_md.map(sanitizeMarkdownTable)

    // Ensure mindmap/timeline and tables are visible in the UI by embedding them into content_md
    if (mermaid_blocks?.length) {
      const mermaidSection = mermaid_blocks
        .map(code => `\n\n\`\`\`mermaid\n${String(code || '').trim()}\n\`\`\``)
        .join('')
      content_md += mermaidSection + '\n'
    }
    if (tables_md?.length) {
      content_md += '\n\n' + tables_md.join('\n\n') + '\n'
    }
    let resources: Array<{ title: string; url: string; [k: string]: any }> = Array.isArray((parsed as any)?.resources) ? (parsed as any).resources : []

    // Optional resource link validation
    const doValidate = process.env.RESOURCES_VALIDATE_HEAD === 'true'
    const filterBroken = process.env.RESOURCES_FILTER_BROKEN === 'true'
    let resourcesValidation: any[] | undefined
    if (doValidate && resources.length) {
      const timeoutMs = Number(process.env.RESOURCES_HEAD_TIMEOUT_MS || 7000)
      const check = async (url: string) => {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort('timeout'), timeoutMs)
        try {
          const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal as any })
          if (!res.ok) {
            const res2 = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal as any })
            return { url, ok: res2.ok, status: res2.status, finalUrl: res2.url }
          }
          return { url, ok: true, status: res.status, finalUrl: res.url }
        } catch (e: any) {
          return { url, ok: false, status: 0, error: String(e?.message || e) }
        } finally {
          clearTimeout(id)
        }
      }
      const results = await Promise.all(resources.map(r => check(r.url)))
      resourcesValidation = results
      if (filterBroken) {
        const okSet = new Set(results.filter(r => r.ok).map(r => r.url))
        resources = resources.filter(r => okSet.has(r.url))
      }
      logger.info('ONECALL_RESOURCES_VALIDATED', { total: resources.length, results: results.slice(0, 5) })
    }

    // Compute idempotency hash
    const hash = crypto.createHash('sha256').update(
      JSON.stringify({ planName, goals, tier, constraints, profile: collectedInfo })
    ).digest('hex').slice(0, 32)

    // Insert plan
    const insertPayload: any = {
      title,
      content: content_md,
      user_id: userId,
      model_used: model,
      word_count: content_md.split(/\s+/).length,
      collected_info: collectedInfo || {},
      metadata: {
        ...(parsed || {}),
        onecall: {
          hash,
          constraints,
          generated_at: new Date().toISOString(),
        }
      }
    }

    const { data: inserted, error: insertError } = await rh
      .from('plans')
      .insert([insertPayload])
      .select('*')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json({ error: 'Failed to save plan', details: insertError?.message }, { status: 500 })
    }
    logger.info('ONECALL_PLAN_INSERTED', { planId: inserted.id })

    // Auto-create external artifacts (paid tiers only)
    const updates: any = { metadata: { ...(inserted.metadata || {}) } }

    // Google Sheets
    if (limits.allowSheets) {
      try {
        const { spreadsheetUrl, spreadsheetId } = await exportPlanToGoogleSheets(inserted, userId)
        updates.metadata.exports = {
          ...(updates.metadata?.exports || {}),
          googleSheets: { url: spreadsheetUrl, id: spreadsheetId, exportedAt: new Date().toISOString() }
        }
        logger.info('ONECALL_EXPORT_SHEETS_OK', { planId: inserted.id })
      } catch (e) {
        logger.warn('ONECALL_EXPORT_SHEETS_FAIL', { error: String(e) })
      }
    }

    // Notion
    if (limits.allowNotion) {
      try {
        const dbId = await getOrCreateFinancialPlanDatabase(userId)
        const planData = { ...(inserted.collected_info || {}), content: inserted.content || '' }
        const notionUrl = await exportFinancialPlanToNotion(userId, inserted.title || 'Kế hoạch tài chính', planData, dbId)
        updates.metadata.exports = {
          ...(updates.metadata?.exports || {}),
          notion: { url: notionUrl, exportedAt: new Date().toISOString() }
        }
        logger.info('ONECALL_EXPORT_NOTION_OK', { planId: inserted.id })
      } catch (e) {
        logger.warn('ONECALL_EXPORT_NOTION_FAIL', { error: String(e) })
      }
    }

    // Persist metadata updates if any
    if (resourcesValidation) {
      updates.metadata = {
        ...updates.metadata,
        resources_validation: resourcesValidation,
      }
    }

    if (updates.metadata && JSON.stringify(updates.metadata) !== JSON.stringify(inserted.metadata)) {
      await rh.from('plans').update({ metadata: updates.metadata }).eq('id', inserted.id)
    }

    // Response payload
    return NextResponse.json({
      success: true,
      plan: {
        id: inserted.id,
        title: inserted.title,
        content_markdown: inserted.content,
        created_at: inserted.created_at,
      },
      artifacts: {
        mermaid_blocks,
        tables_md,
        resources,
        exports: updates.metadata?.exports || null
      },
      tier,
      constraints
    })
  } catch (error: any) {
    logger.error('ONECALL_UNHANDLED', { error: String(error?.message || error) })
    return NextResponse.json({ error: 'One-call generation failed', details: String(error?.message || error) }, { status: 500 })
  }
}
