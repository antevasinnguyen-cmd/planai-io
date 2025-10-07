import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, birthDate } = await request.json()

    if (!birthDate) {
      return NextResponse.json({
        error: 'Cần ngày sinh để phân tích tử vi'
      }, { status: 400 })
    }

    // Generate spiritual analysis using AI
    const prompt = `Dựa trên ngày sinh ${birthDate}, hãy phân tích:
1. Cung hoàng đạo và đặc điểm tính cách
2. Số mệnh (numerology) và ý nghĩa
3. Lời khuyên về tài chính và sự nghiệp
4. Thời điểm thuận lợi trong năm
5. Màu sắc và số may mắn

Trả về JSON format với các trường: zodiac, lifePath, advice, luckyNumbers, luckyColors, favorablePeriods`

    const analysis = await generateChatResponse([
      { role: 'user', content: prompt }
    ])

    // Parse AI response (assuming it returns JSON)
    let spiritualData
    try {
      spiritualData = JSON.parse(analysis)
    } catch {
      // If not JSON, create structured data
      spiritualData = {
        zodiac: 'Đang phân tích...',
        lifePath: 'Đang phân tích...',
        advice: analysis,
        luckyNumbers: [],
        luckyColors: [],
        favorablePeriods: []
      }
    }

    return NextResponse.json({
      success: true,
      analysis: spiritualData
    })

  } catch (error) {
    console.error('Spiritual analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze' },
      { status: 500 }
    )
  }
}
