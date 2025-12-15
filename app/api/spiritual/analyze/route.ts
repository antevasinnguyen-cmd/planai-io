import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { generateChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user using request (cookies / Authorization header)
    const user = await getCurrentUser(request as unknown as Request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, birthDate, birthTime, fullName } = await request.json()

    if (!birthDate) {
      return NextResponse.json({
        error: 'Cần ngày sinh để phân tích tử vi'
      }, { status: 400 })
    }

    // Build comprehensive prompt with all available info
    const nameInfo = fullName ? `Họ tên: ${fullName}\n` : ''
    const timeInfo = birthTime ? ` lúc ${birthTime}` : ''
    
    const prompt = `Bạn là chuyên gia tử vi và thần số học. Hãy phân tích CHI TIẾT và CHUYÊN SÂU cho người sau:

${nameInfo}Ngày sinh: ${birthDate}${timeInfo}

Phân tích các nội dung sau (viết chi tiết, cụ thể, có ý nghĩa thực tiễn):

1. **CUNG HOÀNG ĐẠO**: Xác định cung, đặc điểm tính cách nổi bật, điểm mạnh/yếu trong công việc và tài chính

2. **SỐ CHỦ ĐẠO (LIFE PATH NUMBER)**: Tính toán số chủ đạo từ ngày sinh, giải thích ý nghĩa chi tiết, ảnh hưởng đến sự nghiệp và tài chính

3. **LỜI KHUYÊN TÀI CHÍNH & SỰ NGHIỆP**: 
   - Nghề nghiệp phù hợp nhất
   - Cách quản lý tiền bạc phù hợp với tính cách
   - Những điều nên tránh trong đầu tư
   - Lời khuyên cụ thể để phát triển tài chính

4. **THỜI ĐIỂM THUẬN LỢI**: Các tháng/mùa trong năm thuận lợi cho đầu tư, khởi nghiệp, ký kết hợp đồng

5. **SỐ & MÀU MAY MẮN**: Số may mắn (3-5 số), màu may mắn (2-3 màu) và cách ứng dụng

Trả về ĐÚNG JSON format sau (không có text ngoài JSON):
{
  "zodiac": "Tên cung - Mô tả chi tiết 3-5 câu về tính cách và đặc điểm tài chính",
  "lifePath": "Số X - Giải thích chi tiết 3-5 câu về ý nghĩa và ảnh hưởng",
  "advice": "Lời khuyên chi tiết 5-7 câu về tài chính, sự nghiệp, và phát triển bản thân",
  "luckyNumbers": [số1, số2, số3],
  "luckyColors": ["màu1", "màu2"],
  "favorablePeriods": ["Tháng X-Y: lý do", "Mùa Z: lý do"]
}`

    const analysis = await generateChatResponse([
      { role: 'user', content: prompt }
    ])

    // Parse AI response
    let spiritualData
    try {
      // Try to extract JSON from response (in case AI adds extra text)
      const jsonMatch = analysis.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        spiritualData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      // If not JSON, create structured data from text
      spiritualData = {
        zodiac: 'Đang phân tích dựa trên ngày sinh của bạn...',
        lifePath: 'Số chủ đạo đang được tính toán...',
        advice: analysis,
        luckyNumbers: [3, 7, 9],
        luckyColors: ['Xanh dương', 'Vàng'],
        favorablePeriods: ['Tháng 3-4', 'Tháng 9-10']
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
