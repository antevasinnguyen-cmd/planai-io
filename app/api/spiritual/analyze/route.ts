import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
// NOTE: Không dùng AI nữa - tất cả tính toán đều deterministic

// ============================================
// DETERMINISTIC CALCULATIONS - KHÔNG PHỤ THUỘC AI
// ============================================

// Tính cung hoàng đạo từ ngày/tháng sinh
function calculateZodiac(day: number, month: number): { name: string; description: string } {
  const md = month * 100 + day
  
  if (md >= 321 && md <= 419) return { name: 'Bạch Dương', description: 'Bạn có tính cách mạnh mẽ, quyết đoán và đầy năng lượng. Trong tài chính, bạn thường là người tiên phong, dám chấp nhận rủi ro. Điểm mạnh: Lãnh đạo tốt, sáng tạo. Điểm yếu: Có thể nóng vội trong quyết định đầu tư.' }
  if (md >= 420 && md <= 520) return { name: 'Kim Ngưu', description: 'Bạn kiên định, thực tế và có khả năng quản lý tài chính tốt. Bạn thích sự ổn định và an toàn. Điểm mạnh: Kiên nhẫn, đáng tin cậy. Điểm yếu: Đôi khi quá bảo thủ, bỏ lỡ cơ hội.' }
  if (md >= 521 && md <= 620) return { name: 'Song Tử', description: 'Bạn linh hoạt, thông minh và có khả năng thích ứng cao. Trong tài chính, bạn giỏi nắm bắt xu hướng. Điểm mạnh: Giao tiếp tốt, học hỏi nhanh. Điểm yếu: Có thể thiếu tập trung, dễ thay đổi.' }
  if (md >= 621 && md <= 722) return { name: 'Cự Giải', description: 'Bạn nhạy cảm, trực giác mạnh và có bản năng bảo vệ tài sản. Bạn coi trọng gia đình và sự an toàn tài chính. Điểm mạnh: Tiết kiệm giỏi, trực giác tốt. Điểm yếu: Có thể quá cảm tính trong quyết định.' }
  if (md >= 723 && md <= 822) return { name: 'Sư Tử', description: 'Bạn tự tin, hào phóng và có khả năng lãnh đạo xuất sắc. Trong tài chính, bạn thích đầu tư lớn và có tầm nhìn. Điểm mạnh: Tham vọng cao, thu hút cơ hội. Điểm yếu: Có thể chi tiêu quá tay.' }
  if (md >= 823 && md <= 922) return { name: 'Xử Nữ', description: 'Bạn tỉ mỉ, phân tích giỏi và có kỷ luật tài chính cao. Bạn lập kế hoạch chi tiết trước khi đầu tư. Điểm mạnh: Quản lý chi tiêu tốt, cẩn thận. Điểm yếu: Có thể quá lo lắng, bỏ lỡ cơ hội.' }
  if (md >= 923 && md <= 1022) return { name: 'Thiên Bình', description: 'Bạn cân bằng, công bằng và có khả năng đàm phán tốt. Trong tài chính, bạn tìm kiếm sự hài hòa. Điểm mạnh: Quyết định khách quan, hợp tác tốt. Điểm yếu: Có thể do dự quá lâu.' }
  if (md >= 1023 && md <= 1121) return { name: 'Bọ Cạp', description: 'Bạn quyết đoán, bí ẩn và có trực giác mạnh về đầu tư. Bạn giỏi phát hiện cơ hội ẩn. Điểm mạnh: Nghiên cứu sâu, kiên trì. Điểm yếu: Có thể quá bí mật, khó hợp tác.' }
  if (md >= 1122 && md <= 1221) return { name: 'Nhân Mã', description: 'Bạn lạc quan, thích phiêu lưu và có tầm nhìn xa. Trong tài chính, bạn thích đầu tư mạo hiểm. Điểm mạnh: Tư duy rộng, may mắn. Điểm yếu: Có thể quá liều lĩnh.' }
  if (md >= 1222 || md <= 119) return { name: 'Ma Kết', description: 'Bạn kỷ luật, tham vọng và có kế hoạch dài hạn. Trong tài chính, bạn xây dựng từ từ nhưng vững chắc. Điểm mạnh: Kiên nhẫn, có trách nhiệm. Điểm yếu: Có thể quá cứng nhắc.' }
  if (md >= 120 && md <= 218) return { name: 'Bảo Bình', description: 'Bạn sáng tạo, độc lập và có tư duy đột phá. Trong tài chính, bạn thích đầu tư vào công nghệ mới. Điểm mạnh: Tầm nhìn tương lai, sáng tạo. Điểm yếu: Có thể quá khác biệt.' }
  if (md >= 219 && md <= 320) return { name: 'Song Ngư', description: 'Bạn trực giác mạnh, sáng tạo và giàu cảm xúc. Trong tài chính, bạn cần cân bằng giữa mơ mộng và thực tế. Điểm mạnh: Trực giác tốt, linh hoạt. Điểm yếu: Có thể thiếu thực tế.' }
  
  return { name: 'Không xác định', description: 'Vui lòng kiểm tra lại ngày sinh.' }
}

// Tính số chủ đạo (Life Path Number) từ ngày sinh
function calculateLifePath(day: number, month: number, year: number): { number: number; description: string } {
  // Cộng tất cả các chữ số trong ngày tháng năm sinh
  const sumDigits = (n: number): number => {
    let sum = 0
    while (n > 0) {
      sum += n % 10
      n = Math.floor(n / 10)
    }
    return sum
  }
  
  const reduceToSingle = (n: number): number => {
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = sumDigits(n)
    }
    return n
  }
  
  // Tính tổng: ngày + tháng + năm
  const total = sumDigits(day) + sumDigits(month) + sumDigits(year)
  const lifePathNumber = reduceToSingle(total)
  
  const descriptions: Record<number, string> = {
    1: 'Số 1 - Người tiên phong, lãnh đạo. Bạn có khả năng khởi nghiệp và dẫn dắt. Trong tài chính, bạn nên theo đuổi các dự án độc lập và tự chủ.',
    2: 'Số 2 - Người hợp tác, ngoại giao. Bạn giỏi làm việc nhóm và đàm phán. Trong tài chính, hãy tìm đối tác tin cậy để phát triển.',
    3: 'Số 3 - Người sáng tạo, biểu đạt. Bạn có năng khiếu nghệ thuật và giao tiếp. Trong tài chính, hãy tận dụng khả năng sáng tạo.',
    4: 'Số 4 - Người xây dựng, kỷ luật. Bạn chắc chắn và có kế hoạch. Trong tài chính, hãy xây dựng nền tảng vững chắc từng bước.',
    5: 'Số 5 - Người tự do, linh hoạt. Bạn thích thay đổi và phiêu lưu. Trong tài chính, hãy đa dạng hóa đầu tư nhưng cẩn thận với rủi ro.',
    6: 'Số 6 - Người chăm sóc, trách nhiệm. Bạn coi trọng gia đình. Trong tài chính, hãy cân bằng giữa cho đi và tích lũy.',
    7: 'Số 7 - Người phân tích, tâm linh. Bạn có tư duy sâu sắc. Trong tài chính, hãy nghiên cứu kỹ trước khi quyết định.',
    8: 'Số 8 - Người quyền lực, thành đạt. Bạn có khả năng kiếm tiền và quản lý. Trong tài chính, bạn có tiềm năng lớn nếu có kỷ luật.',
    9: 'Số 9 - Người nhân đạo, hoàn thiện. Bạn có tầm nhìn rộng. Trong tài chính, hãy cân bằng giữa lý tưởng và thực tế.',
    11: 'Số 11 - Master Number, trực giác mạnh. Bạn có khả năng đặc biệt trong việc cảm nhận xu hướng. Trong tài chính, hãy tin vào trực giác.',
    22: 'Số 22 - Master Builder, tầm nhìn lớn. Bạn có khả năng xây dựng đế chế. Trong tài chính, hãy nghĩ lớn và hành động có hệ thống.',
    33: 'Số 33 - Master Teacher, người truyền cảm hứng. Bạn có sứ mệnh cao cả. Trong tài chính, hãy tạo giá trị cho cộng đồng.'
  }
  
  return {
    number: lifePathNumber,
    description: descriptions[lifePathNumber] || `Số ${lifePathNumber} - Đang phân tích...`
  }
}

// Tính số may mắn từ ngày sinh
function calculateLuckyNumbers(day: number, month: number, year: number): number[] {
  const lifePathNum = calculateLifePath(day, month, year).number
  const dayNum = day > 9 ? (Math.floor(day / 10) + day % 10) : day
  const monthNum = month
  
  // Tạo các số may mắn dựa trên số chủ đạo và ngày tháng
  const lucky = new Set<number>()
  lucky.add(lifePathNum)
  lucky.add(dayNum <= 9 ? dayNum : dayNum % 9 || 9)
  lucky.add(monthNum)
  lucky.add((lifePathNum + dayNum) % 9 || 9)
  lucky.add((day + month) % 9 || 9)
  
  return Array.from(lucky).slice(0, 5)
}

// Màu may mắn theo cung hoàng đạo
function getLuckyColors(zodiacName: string): string[] {
  const colorMap: Record<string, string[]> = {
    'Bạch Dương': ['Đỏ', 'Cam'],
    'Kim Ngưu': ['Xanh lá', 'Hồng'],
    'Song Tử': ['Vàng', 'Xanh nhạt'],
    'Cự Giải': ['Trắng', 'Bạc'],
    'Sư Tử': ['Vàng kim', 'Cam'],
    'Xử Nữ': ['Xanh navy', 'Xám'],
    'Thiên Bình': ['Hồng', 'Xanh pastel'],
    'Bọ Cạp': ['Đỏ đậm', 'Đen'],
    'Nhân Mã': ['Tím', 'Xanh dương'],
    'Ma Kết': ['Nâu', 'Đen'],
    'Bảo Bình': ['Xanh dương', 'Bạc'],
    'Song Ngư': ['Xanh biển', 'Tím nhạt']
  }
  return colorMap[zodiacName] || ['Xanh dương', 'Vàng']
}

// Thời điểm thuận lợi theo cung
function getFavorablePeriods(zodiacName: string): string[] {
  const periodMap: Record<string, string[]> = {
    'Bạch Dương': ['Tháng 3-4: Khởi đầu mới thuận lợi', 'Mùa Xuân: Năng lượng cao'],
    'Kim Ngưu': ['Tháng 4-5: Tài lộc hanh thông', 'Mùa Xuân-Hè: Đầu tư bất động sản'],
    'Song Tử': ['Tháng 5-6: Giao tiếp, hợp tác tốt', 'Mùa Hè: Học hỏi, mở rộng'],
    'Cự Giải': ['Tháng 6-7: Gia đình, bất động sản', 'Mùa Hè: Đầu tư an toàn'],
    'Sư Tử': ['Tháng 7-8: Thăng tiến sự nghiệp', 'Mùa Hè: Lãnh đạo, ra mắt'],
    'Xử Nữ': ['Tháng 8-9: Phân tích, lập kế hoạch', 'Mùa Thu: Sắp xếp tài chính'],
    'Thiên Bình': ['Tháng 9-10: Hợp tác, đối tác', 'Mùa Thu: Cân bằng cuộc sống'],
    'Bọ Cạp': ['Tháng 10-11: Đầu tư sâu, nghiên cứu', 'Mùa Thu-Đông: Tái cấu trúc'],
    'Nhân Mã': ['Tháng 11-12: Mở rộng, học hỏi', 'Mùa Đông: Du lịch, trải nghiệm'],
    'Ma Kết': ['Tháng 12-1: Lên kế hoạch năm mới', 'Mùa Đông: Xây dựng nền tảng'],
    'Bảo Bình': ['Tháng 1-2: Đổi mới, sáng tạo', 'Mùa Đông-Xuân: Công nghệ'],
    'Song Ngư': ['Tháng 2-3: Trực giác mạnh', 'Mùa Xuân: Nghệ thuật, sáng tạo']
  }
  return periodMap[zodiacName] || ['Tháng 3-4', 'Mùa Xuân']
}

// Parse ngày sinh từ string
function parseBirthDate(dateStr: string): { day: number; month: number; year: number } | null {
  if (!dateStr) return null
  
  // Hỗ trợ nhiều format: dd/mm/yyyy, dd-mm-yyyy, "14/07/1996 lúc 10:00"
  const match = String(dateStr).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (!match) return null
  
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)
  
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null
  
  return { day, month, year }
}

export async function POST(request: NextRequest) {
  console.log('=== SPIRITUAL API: Request received ===')
  
  try {
    // Authenticate user using request (cookies / Authorization header)
    const user = await getCurrentUser(request as unknown as Request)
    if (!user) {
      console.log('=== SPIRITUAL API: Unauthorized ===')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('=== SPIRITUAL API: User authenticated ===', { userId: user.id })

    let body
    try {
      body = await request.json()
      console.log('=== SPIRITUAL API: Request body ===', body)
    } catch (parseError) {
      console.error('=== SPIRITUAL API: JSON parse error ===', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { planId, birthDate, birthTime, fullName } = body

    if (!birthDate) {
      console.log('=== SPIRITUAL API: Missing birthDate ===')
      return NextResponse.json({
        error: 'Cần ngày sinh để phân tích tử vi'
      }, { status: 400 })
    }

    console.log('=== SPIRITUAL API: Processing birthDate ===', { birthDate, birthTime, fullName })

    // ============================================
    // TÍNH TOÁN DETERMINISTIC - KHÔNG PHỤ THUỘC AI
    // ============================================
    const parsed = parseBirthDate(birthDate)
    
    if (!parsed) {
      console.log('=== SPIRITUAL API: Invalid date format ===', { birthDate })
      return NextResponse.json({
        error: `Định dạng ngày sinh không hợp lệ: "${birthDate}". Vui lòng nhập theo format dd/mm/yyyy`
      }, { status: 400 })
    }

    const { day, month, year } = parsed
    console.log('=== SPIRITUAL API: Parsed date ===', { day, month, year })
    
    // Tính toán tất cả các giá trị một cách deterministic
    const zodiac = calculateZodiac(day, month)
    console.log('=== SPIRITUAL API: Zodiac calculated ===', { zodiac: zodiac.name })
    
    const lifePath = calculateLifePath(day, month, year)
    console.log('=== SPIRITUAL API: Life path calculated ===', { number: lifePath.number })
    
    const luckyNumbers = calculateLuckyNumbers(day, month, year)
    const luckyColors = getLuckyColors(zodiac.name)
    const favorablePeriods = getFavorablePeriods(zodiac.name)

    // Tạo lời khuyên dựa trên cung và số chủ đạo - với null check
    const zodiacParts = zodiac.description.split('.')
    const lifePathParts = lifePath.description.split('.')
    const zodiacAdvice = zodiacParts.length >= 2 ? zodiacParts[zodiacParts.length - 2] : zodiac.description
    const lifePathAdvice = lifePathParts.length >= 1 ? lifePathParts[lifePathParts.length - 1] : lifePath.description
    const periodAdvice = favorablePeriods[0]?.split(':')[0] || 'thời điểm thuận lợi'
    
    const advice = `Với cung ${zodiac.name} và số chủ đạo ${lifePath.number}, bạn có tiềm năng tài chính đặc biệt. ${zodiacAdvice}. ${lifePathAdvice}. Hãy tận dụng thời điểm thuận lợi trong ${periodAdvice} để khởi động các dự án quan trọng. Màu ${luckyColors[0] || 'may mắn'} và số ${luckyNumbers[0] || lifePath.number} sẽ mang lại may mắn cho bạn.`

    // Kết quả hoàn toàn deterministic
    const spiritualData = {
      zodiac: `${zodiac.name} — ${zodiac.description}`,
      lifePath: lifePath.description,
      advice: advice,
      luckyNumbers: luckyNumbers,
      luckyColors: luckyColors,
      favorablePeriods: favorablePeriods,
      // Thêm metadata để debug
      _birthInfo: {
        day, month, year,
        formatted: `${day}/${month}/${year}`,
        birthTime: birthTime || null
      }
    }

    console.log('=== SPIRITUAL API: SUCCESS ===', {
      input: birthDate,
      parsed: { day, month, year },
      zodiac: zodiac.name,
      lifePath: lifePath.number
    })

    return NextResponse.json({
      success: true,
      analysis: spiritualData
    })

  } catch (error: any) {
    console.error('=== SPIRITUAL API: CRITICAL ERROR ===', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { error: `Lỗi phân tích: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
