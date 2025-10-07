import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, collectedInfo } = await request.json()

    // Create comprehensive prompt for plan generation
    const planPrompt = `Dựa trên cuộc trò chuyện sau, hãy tạo một kế hoạch tài chính chi tiết và cá nhân hóa:

${messages.map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n')}

Hãy tạo kế hoạch bao gồm:
1. Tóm tắt mục tiêu
2. Phân tích tình hình hiện tại
3. Lộ trình chi tiết (từng bước cụ thể)
4. Ngân sách và phân bổ tài chính
5. Timeline thực hiện
6. Checklist hành động
7. Rủi ro và giải pháp
8. Lời khuyên và động viên

Format: Markdown với headings, lists, và tables.`

    // Generate plan content using AI
    const planContent = await generateChatResponse([
      { role: 'user', content: planPrompt }
    ])

    // Save plan to database
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        title: `Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`,
        content: planContent,
        collected_info: collectedInfo,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      planId: plan.id,
      message: 'Kế hoạch đã được tạo thành công'
    })

  } catch (error) {
    console.error('Generate plan error:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    )
  }
}
