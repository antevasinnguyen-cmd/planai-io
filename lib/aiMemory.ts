// AI Memory System - Complete redesign for better conversation tracking
// This module handles all AI memory and context management

export interface UserProfile {
  // Basic information
  full_name: string
  age: number | null
  birth_date: string | null
  occupation: string
  location: string
  family_status?: string
  
  // Financial information
  current_income: number | null
  savings: number | null
  expenses: number | null
  debts: number | null
  assets_value?: number | null
  assets?: string[]
  
  // Goals and planning
  financial_goal: string
  goal_amount: number | null
  timeline: string
  timeline_months: number | null
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
  
  // Readiness and capability
  readiness_level: string
  skills: string[]
  available_time: string
  free_hours_per_week?: number | null
  learning_preference: string
  
  // Additional context
  description: string
  challenges: string[]
  opportunities: string[]
  priorities: string[]
  
  // Chat context
  chat_history: any[]
  conversation_summary: string
  key_points: string[]
  questions_asked: string[]
}

export class AIMemorySystem {
  private profile: Partial<UserProfile> = {}
  private messages: any[] = []
  private collectedFields: Set<string> = new Set()
  
  constructor() {
    this.reset()
  }
  
  reset() {
    this.profile = {
      full_name: '',
      age: null,
      birth_date: null,
      occupation: '',
      location: '',
      family_status: '',
      current_income: null,
      savings: null,
      expenses: null,
      debts: null,
      assets_value: null,
      assets: [],
      financial_goal: '',
      goal_amount: null,
      timeline: '',
      timeline_months: null,
      risk_tolerance: 'moderate',
      readiness_level: '',
      skills: [],
      available_time: '',
      free_hours_per_week: null,
      learning_preference: '',
      description: '',
      challenges: [],
      opportunities: [],
      priorities: [],
      chat_history: [],
      conversation_summary: '',
      key_points: [],
      questions_asked: []
    }
    this.messages = []
    this.collectedFields = new Set()
  }
  
  // Process a new message and extract information
  processMessage(message: string, isUser: boolean = true) {
    if (!isUser) return // Only process user messages
    
    this.messages.push({ role: 'user', content: message })
    
    // Extract various types of information
    this.extractName(message)
    this.extractAge(message)
    this.extractBirthDate(message)
    this.extractOccupation(message)
    this.extractLocation(message)
    this.extractIncome(message)
    this.extractSavings(message)
    this.extractExpenses(message)
    this.extractDebts(message)
    this.extractGoal(message)
    this.extractTimeline(message)
    this.extractRiskTolerance(message)
    this.extractReadiness(message)
    this.extractSkills(message)
    this.extractTime(message)
    this.extractFamilyStatus(message)
    this.extractAssets(message)
    this.extractChallenges(message)
    this.extractOpportunities(message)
    
    // Update conversation summary
    this.updateConversationSummary()
  }
  
  private extractName(text: string) {
    // Pattern: "Tên tôi là..." or "Tôi là..." or "Mình tên..."
    const patterns = [
      /(?:tên|gọi)\s+(?:tôi|mình|em|anh|chị)\s+là\s+([A-Za-zÀ-ỹ\s]+)/i,
      /(?:tôi|mình|em)\s+(?:tên|là)\s+([A-Za-zÀ-ỹ\s]+)/i,
      /(?:tôi|mình)\s+là\s+([A-Za-zÀ-ỹ\s]+),?\s+(?:\d+\s+tuổi|năm nay)/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        this.profile.full_name = match[1].trim()
        this.collectedFields.add('full_name')
        break
      }
    }
  }
  
  private extractAge(text: string) {
    // Pattern: "25 tuổi" or "năm nay 25" or "sinh năm 1998"
    const agePattern = /(\d{1,2})\s*(?:tuổi|age)/i
    const ageMatch = text.match(agePattern)
    if (ageMatch) {
      this.profile.age = parseInt(ageMatch[1])
      this.collectedFields.add('age')
    }
    
    // Calculate from birth year
    const yearPattern = /(?:sinh|born)\s*(?:năm)?\s*(\d{4})/i
    const yearMatch = text.match(yearPattern)
    if (yearMatch) {
      const birthYear = parseInt(yearMatch[1])
      this.profile.age = new Date().getFullYear() - birthYear
      this.collectedFields.add('age')
    }
  }
  
  private extractBirthDate(text: string) {
    // Pattern: "14/07/1996" or "14-07-1996" or "14/7/96"
    const patterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
      /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        let [_, day, month, year] = match
        if (year.length === 2) {
          year = (parseInt(year) > 50 ? '19' : '20') + year
        }
        this.profile.birth_date = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
        this.collectedFields.add('birth_date')
        
        // Also calculate age if not set
        if (!this.profile.age) {
          const birthYear = parseInt(year)
          this.profile.age = new Date().getFullYear() - birthYear
          this.collectedFields.add('age')
        }
        break
      }
    }
  }
  
  private extractOccupation(text: string) {
    // Pattern: "làm IT", "nghề kỹ sư", "công việc là", "làm việc tại"
    const patterns = [
      /(?:làm|nghề|job|work)\s+(?:là|nghiệp)?\s*([^,.\n]+)/i,
      /(?:công việc|career)\s+(?:là|hiện tại)?\s*([^,.\n]+)/i,
      /(?:làm việc|working)\s+(?:tại|ở|cho)?\s*([^,.\n]+)/i,
      /(?:tôi|mình|em)\s+là\s+(?:một)?\s*([^,.\n]+?)\s+(?:tại|ở|cho|với)/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        this.profile.occupation = match[1].trim()
        this.collectedFields.add('occupation')
        break
      }
    }
  }
  
  private extractLocation(text: string) {
    // Common cities in Vietnam
    const cities = [
      'hà nội', 'hồ chí minh', 'hcm', 'sài gòn', 'đà nẵng', 'hải phòng',
      'cần thơ', 'biên hòa', 'nha trang', 'huế', 'quy nhơn', 'vũng tàu',
      'long xuyên', 'nam định', 'thái nguyên', 'buôn ma thuột', 'cà mau',
      'hải dương', 'bắc ninh', 'bắc giang', 'quảng ninh', 'thanh hóa',
      'nghệ an', 'hà tĩnh', 'quảng bình', 'quảng trị', 'thừa thiên huế',
      'quảng nam', 'quảng ngãi', 'bình định', 'phú yên', 'khánh hòa',
      'ninh thuận', 'bình thuận', 'kon tum', 'gia lai', 'đắk lắk',
      'đắk nông', 'lâm đồng', 'bình phước', 'tây ninh', 'bình dương',
      'đồng nai', 'bà rịa', 'long an', 'tiền giang', 'bến tre',
      'trà vinh', 'vĩnh long', 'đồng tháp', 'an giang', 'kiên giang',
      'sóc trăng', 'bạc liêu', 'hậu giang'
    ]
    
    const lowerText = text.toLowerCase()
    for (const city of cities) {
      if (lowerText.includes(city)) {
        this.profile.location = city.charAt(0).toUpperCase() + city.slice(1)
        this.collectedFields.add('location')
        break
      }
    }
    
    // Enhanced patterns: "sinh sống", "khu vực sinh sống", "sống ở", "ở tại", "đang ở"
    if (!this.profile.location) {
      const patterns = [
        /(?:khu\s*vực\s*)?(?:sinh\s*sống|sống|ở|đang\s*ở|hiện\s*sống|đang\s*sinh\s*sống|live|living)\s*(?:tại|ở)?\s*([^,.\n]+)/i,
        /(?:đến từ|quê|from)\s+([^,.\n]+)/i,
        /(?:khu\s*vực)\s*[:\-]?\s*([^,.\n]+)/i
      ]
      
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          const location = match[1].trim()
          if (location.length >= 3) {
            this.profile.location = location
            this.collectedFields.add('location')
            break
          }
        }
      }
    }
  }
  
  private extractIncome(text: string) {
    // Pattern: "20 triệu/tháng", "20tr", "20.000.000", "lương 20 triệu"
    const patterns = [
      /(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|trieu|million)\s*(?:\/?\s*tháng|\/month|đồng\/tháng)?/gi,
      /(?:lương|thu nhập|income|salary)\s*(?:là|khoảng|tầm)?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/gi,
      /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{3})?)\s*(?:đồng|vnd|vnđ)\s*(?:\/?\s*tháng)?/gi
    ]
    
    for (const pattern of patterns) {
      let m: RegExpExecArray | null
      const re = new RegExp(pattern.source, pattern.flags)
      while ((m = re.exec(text)) !== null) {
        let amountStr = (m[1] || '').replace(/[.,]/g, '')
        let amountNum: number
        if (text.toLowerCase().includes('triệu') || text.toLowerCase().includes('tr')) {
          amountNum = parseFloat(amountStr) * 1000000
        } else if (amountStr.length > 6) {
          amountNum = parseFloat(amountStr)
        } else {
          continue
        }
        if (amountNum >= 1000000 && amountNum <= 1000000000) {
          this.profile.current_income = amountNum
          this.collectedFields.add('current_income')
          break
        }
      }
      if (this.profile.current_income) break
    }
  }
  
  private extractSavings(text: string) {
    // Enhanced patterns: "tiết kiệm hiện có", "tiết kiệm hiện tại", "tiết kiệm 100 triệu", "có 100tr", "để dành 100 triệu"
    const patterns = [
      /(?:tiết\s*kiệm\s*(?:hiện\s*có|hiện\s*tại|được)?|có|để\s*dành|saved|saving)\s*(?:được|khoảng|tầm|là)?\s*(\d+(?:[.,]\d+)?)\s*(?:tỷ|ty|billion|triệu|tr|million)/gi,
      /(?:hiện|currently)\s+(?:có|tại|have)\s*(\d+(?:[.,]\d+)?)\s*(?:tỷ|ty|triệu|tr)/gi,
      /(?:số\s*tiền\s*)?(?:tiết\s*kiệm|để\s*dành)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*(?:tỷ|ty|triệu|tr)/gi
    ]
    
    for (const pattern of patterns) {
      let m: RegExpExecArray | null
      const re = new RegExp(pattern.source, pattern.flags)
      while ((m = re.exec(text)) !== null) {
        let amount = parseFloat((m[1] || '').replace(/[.,]/g, ''))
        const matchText = (m[0] || '').toLowerCase()
        if (matchText.includes('tỷ') || matchText.includes('ty') || matchText.includes('billion')) {
          amount *= 1000000000
        } else {
          amount *= 1000000
        }
        if (amount >= 100000 && amount <= 100000000000) {
          this.profile.savings = amount
          this.collectedFields.add('savings')
          break
        }
      }
      if (this.profile.savings) break
    }
  }
  
  private extractExpenses(text: string) {
    // Pattern: "chi tiêu 10 triệu/tháng", "chi phí 10tr"
    const patterns = [
      /(?:chi tiêu|chi phí|expense|spend)\s*(?:khoảng|tầm)?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\s*(?:\/?\s*tháng)?/gi
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        this.profile.expenses = parseFloat(match[1].replace(/[.,]/g, '')) * 1000000
        this.collectedFields.add('expenses')
        break
      }
    }
  }
  
  private extractDebts(text: string) {
    // Pattern: "nợ 50 triệu", "vay 100tr"
    const patterns = [
      /(?:nợ|vay|debt|loan|owe)\s*(?:khoảng|tầm)?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/gi
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        this.profile.debts = parseFloat(match[1].replace(/[.,]/g, '')) * 1000000
        this.collectedFields.add('debts')
        break
      }
    }
  }
  
  private extractGoal(text: string) {
    // Pattern: "mua nhà", "mua xe", "tiết kiệm", "du học", etc.
    const goalKeywords = [
      'mua nhà', 'mua xe', 'mua ô tô', 'mua đất', 'xây nhà',
      'du học', 'du lịch', 'đi học', 'học thạc sĩ', 'MBA',
      'tiết kiệm', 'để dành', 'đầu tư', 'kinh doanh', 'khởi nghiệp',
      'cưới', 'kết hôn', 'con cái', 'nghỉ hưu', 'về hưu'
    ]
    
    const lowerText = text.toLowerCase()
    for (const keyword of goalKeywords) {
      if (lowerText.includes(keyword)) {
        // Extract the sentence containing the goal
        const sentences = text.split(/[.!?]/)
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            this.profile.financial_goal = sentence.trim()
            this.collectedFields.add('financial_goal')
            
            // Try to extract goal amount
            const amountPattern = /(\d+(?:[.,]\d+)?)\s*(?:tỷ|ty|billion|triệu|tr|million)/gi
            const amountMatch = sentence.match(amountPattern)
            if (amountMatch) {
              let amount = parseFloat(amountMatch[0].replace(/[.,]/g, '').replace(/\D/g, ''))
              if (sentence.toLowerCase().includes('tỷ')) {
                amount *= 1000000000
              } else {
                amount *= 1000000
              }
              this.profile.goal_amount = amount
              this.collectedFields.add('goal_amount')
            }
            break
          }
        }
        break
      }
    }
  }
  
  private extractTimeline(text: string) {
    // Pattern: "trong 2 năm", "5 năm nữa", "6 tháng", "2 - 3 năm", "2–3 năm", "2—3 năm", "ngắn hạn", "dài hạn"
    const patterns = [
      /(?:trong|within)\s*(\d+)\s*(năm|tháng|year|month)/i,
      /(\d+)\s*(năm|tháng|year|month)\s*(?:nữa|tới|next)/i,
      /(\d+)\s*[-–—]\s*(\d+)\s*(năm|tháng|year|month)/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        if (match.length === 4) {
          // Range form: e.g., 2 - 3 năm
          const n1 = parseInt(match[1])
          const n2 = parseInt(match[2])
          const unit = match[3].toLowerCase()
          this.profile.timeline = match[0]
          this.collectedFields.add('timeline')
          // Use the midpoint as representative months
          const mid = Math.round((n1 + n2) / 2)
          if (unit.includes('năm') || unit.includes('year')) {
            this.profile.timeline_months = mid * 12
          } else {
            this.profile.timeline_months = mid
          }
          this.collectedFields.add('timeline_months')
        } else {
          const number = parseInt(match[1])
          const unit = match[2].toLowerCase()
          this.profile.timeline = match[0]
          this.collectedFields.add('timeline')
          if (unit.includes('năm') || unit.includes('year')) {
            this.profile.timeline_months = number * 12
          } else {
            this.profile.timeline_months = number
          }
          this.collectedFields.add('timeline_months')
        }
        break
      }
    }
    
    // Check for general terms
    if (!this.profile.timeline) {
      if (text.toLowerCase().includes('ngắn hạn') || text.toLowerCase().includes('short term')) {
        this.profile.timeline = 'Ngắn hạn (< 1 năm)'
        this.profile.timeline_months = 6
        this.collectedFields.add('timeline')
        this.collectedFields.add('timeline_months')
      } else if (text.toLowerCase().includes('trung hạn') || text.toLowerCase().includes('medium term')) {
        this.profile.timeline = 'Trung hạn (1-3 năm)'
        this.profile.timeline_months = 24
        this.collectedFields.add('timeline')
        this.collectedFields.add('timeline_months')
      } else if (text.toLowerCase().includes('dài hạn') || text.toLowerCase().includes('long term')) {
        this.profile.timeline = 'Dài hạn (> 3 năm)'
        this.profile.timeline_months = 60
        this.collectedFields.add('timeline')
        this.collectedFields.add('timeline_months')
      }
    }
  }
  
  private extractRiskTolerance(text: string) {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('an toàn') || lowerText.includes('ít rủi ro') || lowerText.includes('conservative')) {
      this.profile.risk_tolerance = 'conservative'
      this.collectedFields.add('risk_tolerance')
    } else if (lowerText.includes('mạo hiểm') || lowerText.includes('rủi ro cao') || lowerText.includes('aggressive')) {
      this.profile.risk_tolerance = 'aggressive'
      this.collectedFields.add('risk_tolerance')
    } else if (lowerText.includes('cân bằng') || lowerText.includes('vừa phải') || lowerText.includes('moderate')) {
      this.profile.risk_tolerance = 'moderate'
      this.collectedFields.add('risk_tolerance')
    }
  }
  
  private extractReadiness(text: string) {
    const lowerText = text.toLowerCase()
    
    const readinessKeywords = {
      high: ['sẵn sàng', 'quyết tâm', 'nhiệt tình', 'cam kết', 'ready', 'committed'],
      medium: ['có thể', 'cố gắng', 'thử', 'perhaps', 'try'],
      low: ['chưa chắc', 'không chắc', 'còn phân vân', 'unsure', 'hesitant']
    }
    
    for (const [level, keywords] of Object.entries(readinessKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          this.profile.readiness_level = level
          this.collectedFields.add('readiness_level')
          return
        }
      }
    }
  }
  
  private extractSkills(text: string) {
    const skillKeywords = [
      'lập trình', 'coding', 'IT', 'marketing', 'sales', 'bán hàng',
      'thiết kế', 'design', 'kế toán', 'accounting', 'quản lý', 'management',
      'ngoại ngữ', 'english', 'tiếng anh', 'giao tiếp', 'communication',
      'phân tích', 'analysis', 'excel', 'data', 'AI', 'machine learning'
    ]
    
    const lowerText = text.toLowerCase()
    const foundSkills: string[] = []
    
    for (const skill of skillKeywords) {
      if (lowerText.includes(skill)) {
        foundSkills.push(skill)
      }
    }
    
    if (foundSkills.length > 0) {
      this.profile.skills = [...new Set([...this.profile.skills || [], ...foundSkills])]
      this.collectedFields.add('skills')
    }
  }
  
  private extractTime(text: string) {
    // Pattern: "2 giờ/ngày", "10 giờ/tuần", "full time"
    const patterns = [
      /(\d+)\s*(giờ|hour)\s*\/\s*(ngày|day|tuần|week)/i,
      /(?:full[\s-]?time|toàn thời gian)/i,
      /(?:part[\s-]?time|bán thời gian)/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        this.profile.available_time = match[0]
        this.collectedFields.add('available_time')
        // Compute free hours/week if pattern provides value
        if (match.length >= 4) {
          const qty = parseInt(match[1])
          const unit2 = (match[3] || '').toLowerCase()
          if (!isNaN(qty)) {
            if (unit2.includes('ngày') || unit2.includes('day')) {
              this.profile.free_hours_per_week = qty * 7
            } else if (unit2.includes('tuần') || unit2.includes('week')) {
              this.profile.free_hours_per_week = qty
            }
            if (this.profile.free_hours_per_week != null) {
              this.collectedFields.add('free_hours_per_week')
            }
          }
        }
        break
      }
    }
  }

  private extractFamilyStatus(text: string) {
    const lower = text.toLowerCase()
    if (/(độc thân|single|fa\b)/i.test(lower)) {
      this.profile.family_status = 'độc thân'
      this.collectedFields.add('family_status')
      return
    }
    if (/(kết hôn|đã kết hôn|married|có vợ|có chồng)/i.test(lower)) {
      this.profile.family_status = 'kết hôn'
      this.collectedFields.add('family_status')
    } else if (/(ly hôn|divorce|divorced|ly thân|separated)/i.test(lower)) {
      this.profile.family_status = 'ly hôn/ly thân'
      this.collectedFields.add('family_status')
    }
    // Children count (optional enrichment)
    const childMatch = lower.match(/(\d+)\s*(con|children|kid)/i)
    if (childMatch) {
      const count = childMatch[1]
      const base = this.profile.family_status || 'kết hôn'
      this.profile.family_status = `${base} (${count} con)`
      this.collectedFields.add('family_status')
    }
  }

  private extractAssets(text: string) {
    const lower = text.toLowerCase()
    // Value patterns: "tài sản X triệu/tỷ"
    const valMatch = lower.match(/tài\s*sản[^\d]*(\d+(?:[.,]\d+)?)\s*(tỷ|ty|billion|triệu|tr|million)/i)
    if (valMatch) {
      let val = parseFloat(valMatch[1].replace(/[.,]/g, ''))
      const unit = valMatch[2]
      if (/tỷ|ty|billion/i.test(unit)) val *= 1000000000
      else val *= 1000000
      if (!isNaN(val)) {
        this.profile.assets_value = val
        this.collectedFields.add('assets_value')
      }
    }
    // Categories
    const cats = [
      { kw: ['bất động sản', 'nhà', 'căn hộ', 'đất'], tag: 'bất động sản' },
      { kw: ['ô tô', 'xe'], tag: 'phương tiện' },
      { kw: ['cổ phiếu', 'stock', 'chứng khoán'], tag: 'cổ phiếu' },
      { kw: ['trái phiếu', 'bond'], tag: 'trái phiếu' },
      { kw: ['vàng', 'gold'], tag: 'vàng' },
      { kw: ['tiền mặt', 'cash'], tag: 'tiền mặt' },
      { kw: ['crypto', 'tiền số', 'tiền điện tử'], tag: 'crypto' }
    ]
    const found: string[] = []
    for (const c of cats) {
      if (c.kw.some(k => lower.includes(k))) found.push(c.tag)
    }
    if (found.length > 0) {
      this.profile.assets = Array.from(new Set([...(this.profile.assets || []), ...found]))
      this.collectedFields.add('assets')
    }
  }
  
  private extractChallenges(text: string) {
    const challengeKeywords = [
      'khó khăn', 'vấn đề', 'thách thức', 'lo lắng', 'lo ngại',
      'problem', 'challenge', 'difficult', 'worry', 'concern'
    ]
    
    const lowerText = text.toLowerCase()
    for (const keyword of challengeKeywords) {
      if (lowerText.includes(keyword)) {
        // Extract the sentence containing the challenge
        const sentences = text.split(/[.!?]/)
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            if (!this.profile.challenges) this.profile.challenges = []
            this.profile.challenges.push(sentence.trim())
            this.collectedFields.add('challenges')
            break
          }
        }
      }
    }
  }
  
  private extractOpportunities(text: string) {
    const opportunityKeywords = [
      'cơ hội', 'tiềm năng', 'có thể', 'dự định', 'kế hoạch',
      'opportunity', 'potential', 'plan', 'intend'
    ]
    
    const lowerText = text.toLowerCase()
    for (const keyword of opportunityKeywords) {
      if (lowerText.includes(keyword)) {
        // Extract the sentence containing the opportunity
        const sentences = text.split(/[.!?]/)
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            if (!this.profile.opportunities) this.profile.opportunities = []
            this.profile.opportunities.push(sentence.trim())
            this.collectedFields.add('opportunities')
            break
          }
        }
      }
    }
  }
  
  private updateConversationSummary() {
    // Create a summary of key points from the conversation
    const keyPoints: string[] = []
    
    if (this.profile.financial_goal) {
      keyPoints.push(`Mục tiêu: ${this.profile.financial_goal}`)
    }
    if (this.profile.current_income) {
      keyPoints.push(`Thu nhập: ${(this.profile.current_income / 1000000).toFixed(1)} triệu/tháng`)
    }
    if (this.profile.timeline) {
      keyPoints.push(`Thời gian: ${this.profile.timeline}`)
    }
    if (this.profile.savings) {
      keyPoints.push(`Tiết kiệm hiện có: ${(this.profile.savings / 1000000).toFixed(1)} triệu`)
    }
    
    this.profile.key_points = keyPoints
    this.profile.chat_history = this.messages
  }
  
  // Get current profile
  getProfile(): Partial<UserProfile> {
    return this.profile
  }
  
  // Get collected fields
  getCollectedFields(): string[] {
    return Array.from(this.collectedFields)
  }
  
  // Get completion percentage
  getCompletionPercentage(): number {
    const requiredFields = [
      'financial_goal', 'current_income', 'timeline', 'occupation'
    ]
    
    const collectedRequired = requiredFields.filter(field => 
      this.collectedFields.has(field)
    ).length
    
    return Math.round((collectedRequired / requiredFields.length) * 100)
  }
  
  // Check if ready to generate plan
  isReadyForPlan(): boolean {
    // Minimum required: goal and at least one of income/timeline
    return this.collectedFields.has('financial_goal') && 
           (this.collectedFields.has('current_income') || this.collectedFields.has('timeline'))
  }
  
  // Export for plan generation
  exportForPlanGeneration() {
    return {
      profile: this.profile,
      messages: this.messages,
      collectedFields: Array.from(this.collectedFields),
      completionPercentage: this.getCompletionPercentage(),
      isReady: this.isReadyForPlan()
    }
  }
  
  // Load from saved state
  loadFromState(state: any) {
    if (state.profile) this.profile = state.profile
    if (state.messages) this.messages = state.messages
    if (state.collectedFields) this.collectedFields = new Set(state.collectedFields)
  }
  
  // Save current state
  saveState() {
    return {
      profile: this.profile,
      messages: this.messages,
      collectedFields: Array.from(this.collectedFields)
    }
  }
}

// Singleton instance
let memorySystemInstance: AIMemorySystem | null = null

export const getAIMemorySystem = () => {
  if (!memorySystemInstance) {
    memorySystemInstance = new AIMemorySystem()
  }
  return memorySystemInstance
}

export const resetAIMemory = () => {
  if (memorySystemInstance) {
    memorySystemInstance.reset()
  }
}
