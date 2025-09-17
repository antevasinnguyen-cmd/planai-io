// Spiritual analysis utilities for PlanAI

export interface SpiritualProfile {
  birthDate: string
  birthTime?: string
  birthPlace?: string
  zodiacSign: string
  chineseZodiac: string
  lifePathNumber: number
  destinyNumber: number
  personalityNumber: number
}

export const getZodiacSign = (birthDate: string): string => {
  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()

  const zodiacSigns = [
    { sign: 'Ma Kết', start: [12, 22], end: [1, 19] },
    { sign: 'Bảo Bình', start: [1, 20], end: [2, 18] },
    { sign: 'Song Ngư', start: [2, 19], end: [3, 20] },
    { sign: 'Bạch Dương', start: [3, 21], end: [4, 19] },
    { sign: 'Kim Ngưu', start: [4, 20], end: [5, 20] },
    { sign: 'Song Tử', start: [5, 21], end: [6, 20] },
    { sign: 'Cự Giải', start: [6, 21], end: [7, 22] },
    { sign: 'Sư Tử', start: [7, 23], end: [8, 22] },
    { sign: 'Xử Nữ', start: [8, 23], end: [9, 22] },
    { sign: 'Thiên Bình', start: [9, 23], end: [10, 22] },
    { sign: 'Bọ Cạp', start: [10, 23], end: [11, 21] },
    { sign: 'Nhân Mã', start: [11, 22], end: [12, 21] }
  ]

  for (const zodiac of zodiacSigns) {
    const [startMonth, startDay] = zodiac.start
    const [endMonth, endDay] = zodiac.end

    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return zodiac.sign
    }
  }

  return 'Ma Kết' // Default fallback
}

export const getChineseZodiac = (birthDate: string): string => {
  const year = new Date(birthDate).getFullYear()
  const animals = [
    'Tý (Chuột)', 'Sửu (Trâu)', 'Dần (Hổ)', 'Mão (Mèo)',
    'Thìn (Rồng)', 'Tỵ (Rắn)', 'Ngọ (Ngựa)', 'Mùi (Dê)',
    'Thân (Khỉ)', 'Dậu (Gà)', 'Tuất (Chó)', 'Hợi (Heo)'
  ]
  
  return animals[(year - 4) % 12]
}

export const calculateLifePathNumber = (birthDate: string): number => {
  const date = birthDate.replace(/-/g, '')
  let sum = 0
  
  for (let digit of date) {
    sum += parseInt(digit)
  }
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0)
  }
  
  return sum
}

export const calculateDestinyNumber = (fullName: string): number => {
  const vowels = 'AEIOUÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬEÈÉẺẼẸÊỀẾỂỄỆIÌÍỈĨỊOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢUÙÚỦŨỤƯỪỨỬỮỰ'
  let sum = 0
  
  const letterValues: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
  }
  
  for (let char of fullName.toUpperCase()) {
    if (vowels.includes(char) && letterValues[char]) {
      sum += letterValues[char]
    }
  }
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0)
  }
  
  return sum
}

export const calculatePersonalityNumber = (fullName: string): number => {
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'
  let sum = 0
  
  const letterValues: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
  }
  
  for (let char of fullName.toUpperCase()) {
    if (consonants.includes(char) && letterValues[char]) {
      sum += letterValues[char]
    }
  }
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0)
  }
  
  return sum
}

export const generateSpiritualProfile = (birthDate: string, fullName: string): SpiritualProfile => {
  return {
    birthDate,
    zodiacSign: getZodiacSign(birthDate),
    chineseZodiac: getChineseZodiac(birthDate),
    lifePathNumber: calculateLifePathNumber(birthDate),
    destinyNumber: calculateDestinyNumber(fullName),
    personalityNumber: calculatePersonalityNumber(fullName)
  }
}

export const getSpiritualFinancialInsights = (profile: SpiritualProfile): string => {
  const insights = []
  
  // Zodiac-based insights
  const zodiacInsights: { [key: string]: string } = {
    'Bạch Dương': 'Bạn có xu hướng đầu tư mạo hiểm và quyết đoán nhanh. Hãy cân nhắc kỹ trước khi đưa ra quyết định tài chính lớn.',
    'Kim Ngưu': 'Bạn có tính cách bảo thủ trong tài chính và thích sự ổn định. Đầu tư dài hạn và tiết kiệm sẽ phù hợp với bạn.',
    'Song Tử': 'Bạn có xu hướng đa dạng hóa đầu tư và thích khám phá các cơ hội mới. Hãy tập trung vào một vài kênh chính.',
    'Cự Giải': 'Bạn rất thận trọng với tiền bạc và có xu hướng tiết kiệm. Hãy cân nhắc đầu tư để tăng trưởng tài sản.',
    'Sư Tử': 'Bạn có xu hướng chi tiêu hào phóng và thích đầu tư vào những thứ có giá trị cao. Hãy kiểm soát chi tiêu cá nhân.',
    'Xử Nữ': 'Bạn rất tỉ mỉ trong quản lý tài chính và thích lập kế hoạch chi tiết. Đây là điểm mạnh lớn của bạn.',
    'Thiên Bình': 'Bạn thích cân bằng giữa tiết kiệm và chi tiêu. Hãy tìm hiểu về đầu tư cân bằng rủi ro.',
    'Bọ Cạp': 'Bạn có trực giác tốt về đầu tư và thích nghiên cứu sâu. Hãy tin vào phân tích của mình.',
    'Nhân Mã': 'Bạn thích tự do tài chính và có xu hướng đầu tư vào trải nghiệm. Hãy cân bằng với tiết kiệm dài hạn.',
    'Ma Kết': 'Bạn có tư duy kinh doanh tốt và thích xây dựng tài sản từ từ. Đầu tư bất động sản có thể phù hợp.',
    'Bảo Bình': 'Bạn thích đầu tư vào công nghệ và xu hướng mới. Hãy nghiên cứu kỹ trước khi đầu tư.',
    'Song Ngư': 'Bạn có trực giác tốt nhưng đôi khi thiếu thực tế. Hãy kết hợp cảm tính với phân tích logic.'
  }
  
  if (zodiacInsights[profile.zodiacSign]) {
    insights.push(`**Theo cung hoàng đạo ${profile.zodiacSign}:** ${zodiacInsights[profile.zodiacSign]}`)
  }
  
  // Life Path Number insights
  const lifePathInsights: { [key: number]: string } = {
    1: 'Bạn có khả năng lãnh đạo tự nhiên. Hãy cân nhắc khởi nghiệp hoặc đầu tư vào doanh nghiệp riêng.',
    2: 'Bạn thích hợp tác và làm việc nhóm. Đầu tư chung hoặc quỹ đầu tư có thể phù hợp.',
    3: 'Bạn có khả năng sáng tạo cao. Hãy đầu tư vào các lĩnh vực nghệ thuật, truyền thông.',
    4: 'Bạn thích sự ổn định và có kỷ luật cao. Đầu tư dài hạn và tiết kiệm đều đặn sẽ mang lại thành công.',
    5: 'Bạn thích tự do và thay đổi. Đa dạng hóa danh mục đầu tư sẽ phù hợp với tính cách.',
    6: 'Bạn có trách nhiệm cao với gia đình. Hãy ưu tiên bảo hiểm và quỹ giáo dục con em.',
    7: 'Bạn thích nghiên cứu và phân tích. Hãy tận dụng khả năng này để đầu tư thông minh.',
    8: 'Bạn có tài kinh doanh và quản lý tài chính tốt. Đầu tư bất động sản và kinh doanh sẽ thành công.',
    9: 'Bạn có tầm nhìn rộng và thích giúp đỡ người khác. Đầu tư có tác động xã hội sẽ phù hợp.'
  }
  
  if (lifePathInsights[profile.lifePathNumber]) {
    insights.push(`**Theo số đường đời ${profile.lifePathNumber}:** ${lifePathInsights[profile.lifePathNumber]}`)
  }
  
  return insights.join('\n\n')
}
