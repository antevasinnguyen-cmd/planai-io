/**
 * PlanAI V3 - Ultra Smart & Personalized Financial Planning
 * Focus: Maximum intelligence, deep personalization, actionable insights
 * Target: Create the most comprehensive, personalized financial ebook in Vietnam
 */

import crypto from 'crypto'

/**
 * Calculate Life Path Number for numerology analysis
 */
function calculateLifePath(birthDate: string): number {
  if (!birthDate) return 0
  const digits = birthDate.replace(/\D/g, '')
  let sum = digits.split('').reduce((acc, digit) => acc + parseInt(digit), 0)
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0)
  }
  return sum
}

/**
 * Get zodiac sign from birth date
 */
function getZodiacSign(birthDate: string): string {
  if (!birthDate) return 'Chưa xác định'
  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  const signs = [
    { name: 'Ma Kết', start: [12, 22], end: [1, 19] },
    { name: 'Bảo Bình', start: [1, 20], end: [2, 18] },
    { name: 'Song Ngư', start: [2, 19], end: [3, 20] },
    { name: 'Bạch Dương', start: [3, 21], end: [4, 19] },
    { name: 'Kim Ngưu', start: [4, 20], end: [5, 20] },
    { name: 'Song Tử', start: [5, 21], end: [6, 20] },
    { name: 'Cự Giải', start: [6, 21], end: [7, 22] },
    { name: 'Sư Tử', start: [7, 23], end: [8, 22] },
    { name: 'Xử Nữ', start: [8, 23], end: [9, 22] },
    { name: 'Thiên Bình', start: [9, 23], end: [10, 22] },
    { name: 'Hổ Cáp', start: [10, 23], end: [11, 21] },
    { name: 'Nhân Mã', start: [11, 22], end: [12, 21] }
  ]
  
  for (const sign of signs) {
    if ((month === sign.start[0] && day >= sign.start[1]) ||
        (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name
    }
  }
  return 'Chưa xác định'
}

/**
 * Generate FREE tier prompt (9 sections)
 */
function getFreeTierPrompt(userInfo: any): string {
  return `
🎯 BẠN LÀ AI:
Bạn là chuyên gia tài chính cấp cao với 25+ năm kinh nghiệm, đang viết EBOOK TÀI CHÍNH CÁ NHÂN HÓA cho người Việt Nam.
Bạn có khả năng phân tích sâu sắc, tư duy hệ thống, và hiểu rõ văn hóa & kinh tế Việt Nam.

📊 YÊU CẦU: Tạo kế hoạch tài chính GÓI FREE với 9 phần chính:

## 1️⃣ TÓM TẮT THÔNG TIN NGƯỜI DÙNG
Trình bày đầy đủ, rõ ràng:
- Họ tên: ${userInfo.full_name || 'Chưa cung cấp'}
- Tuổi/Năm sinh: ${userInfo.age || 'Chưa cung cấp'}
- Nơi sống: ${userInfo.location || 'Việt Nam'}
- Thu nhập hiện tại: **${userInfo.income || 0} VNĐ/tháng**
- Tiết kiệm hiện có: **${userInfo.savings || 0} VNĐ**
- Nghề nghiệp: ${userInfo.occupation || 'Chưa cung cấp'}
- Kỹ năng: ${userInfo.skills || 'Cần khám phá'}
- Mục tiêu tài chính: ${userInfo.goal || 'Chưa xác định'}
- Timeline: ${userInfo.timeline || '12 tháng'}
- Mức độ sẵn sàng: ${userInfo.readiness || 'Trung bình'}
- Thông tin khác: Phân tích chi tiết mọi thông tin user chia sẻ

## 2️⃣ PHÂN TÍCH SWOT CÁ NHÂN
Kết hợp dữ liệu thực tế Việt Nam 11/2025:
**STRENGTHS (Điểm mạnh)**:
- Phân tích 3-5 điểm mạnh cụ thể
- So sánh với thị trường lao động VN
- Lợi thế cạnh tranh cá nhân

**WEAKNESSES (Điểm yếu)**:
- 3-5 điểm yếu cần cải thiện
- Rào cản cá nhân
- Kỹ năng thiếu hụt

**OPPORTUNITIES (Cơ hội)**:
- Xu hướng thị trường 2025-2026
- Cơ hội nghề nghiệp tại ${userInfo.location || 'Việt Nam'}
- Lĩnh vực tiềm năng

**THREATS (Thách thức)**:
- Rủi ro kinh tế vĩ mô
- Cạnh tranh ngành
- Thách thức cá nhân

## 3️⃣ PHÂN TÍCH MỤC TIÊU TÀI CHÍNH
Deep dive vào từng mục tiêu:
- Tổng mục tiêu: Tính chính xác số tiền
- Phân tích tính khả thi (với thu nhập hiện tại)
- Gap analysis: Khoảng cách cần vượt qua
- Ưu tiên các mục tiêu (urgent vs important)
- Timeline realistc cho từng mục tiêu

## 4️⃣ YẾU TỐ KHÁCH QUAN & CHỦ QUAN
**Khách quan**:
- Kinh tế Việt Nam 2025-2026
- Lạm phát, lãi suất, tỷ giá
- Thị trường BĐS, chứng khoán
- Cơ hội đầu tư

**Chủ quan**:
- Mindset về tiền bạc
- Kỷ luật tài chính
- Risk tolerance
- Commitment level

## 5️⃣ KỸ NĂNG & KINH NGHIỆM CẦN CÓ
Liệt kê chi tiết:
- Top 5 kỹ năng MUST HAVE
- Kỹ năng hiện có vs cần học
- Roadmap học tập (timeline cụ thể)
- Chi phí & ROI của việc học

## 6️⃣ LỘ TRÌNH KẾ HOẠCH CHI TIẾT
Chia theo timeline của user:
- Milestone quan trọng
- KPI cho từng giai đoạn
- Contingency plans
- Review & adjust points

## 7️⃣ HÀNH ĐỘNG CỤ THỂ THEO THỜI GIAN
**Tháng 1-3**: [Chi tiết từng tháng]
**Tháng 4-6**: [Chi tiết từng tháng]
**Tháng 7-9**: [Chi tiết từng tháng]
**Tháng 10-12**: [Chi tiết từng tháng]
Mỗi tháng gồm:
- 3-5 hành động cụ thể
- Deadline rõ ràng
- Success metrics

## 8️⃣ TÀI LIỆU HỌC TẬP (Tối thiểu 5)
Mỗi tài liệu phải có:
| STT | Tên tài liệu | Loại | Link trực tiếp | Mô tả giá trị |
|-----|--------------|------|----------------|---------------|
| 1 | [Tên cụ thể] | Video/Khóa học | [URL thật] | Học được gì, giúp gì cho mục tiêu |

Ưu tiên: Coursera, edX, Khan Academy, YouTube (>50k views)

## 9️⃣ KẾT LUẬN & CTA
- Tóm tắt 3 key takeaways
- Next steps trong 24h
- Lời động viên cá nhân hóa
- **CTA nâng cấp**: "Gói Premium có thêm: Phân tích tử vi tài chính, 24 phần chi tiết, Google Sheets tự động, 50+ tài liệu..."

📝 FORMAT OUTPUT:
{
  "title": "Kế hoạch tài chính cá nhân cho [Tên]",
  "tier": "free",
  "content_markdown": "[Nội dung 9 phần trên]",
  "mermaid_blocks": ["mindmap lộ trình"],
  "tables_md": ["bảng SWOT", "bảng tài liệu"],
  "resources": [5-10 resources]
}
`
}

/**
 * Generate PREMIUM tier prompt (24 sections)
 */
function getPremiumTierPrompt(userInfo: any, tier: string): string {
  const lifePath = calculateLifePath(userInfo.birth_date)
  const zodiac = getZodiacSign(userInfo.birth_date)
  
  return `
🌟 BẠN LÀ AI:
Bạn là đội ngũ chuyên gia tài chính hàng đầu gồm:
- CFO với 30+ năm kinh nghiệm quản lý tài chính doanh nghiệp
- Investment banker từ Goldman Sachs
- Startup founder đã exit thành công
- Chuyên gia phong thủy & tử vi tài chính
Đang viết EBOOK PREMIUM cá nhân hóa sâu cho khách hàng VIP.

📊 YÊU CẦU: Tạo kế hoạch PREMIUM ${tier.toUpperCase()} với 24 phần chuyên sâu:

## 1️⃣ TIÊU ĐỀ SÁNG TẠO
Tạo tiêu đề độc đáo, cá nhân hóa theo mục tiêu và tính cách user

## 2️⃣ TỔNG QUAN KẾ HOẠCH
**Executive Summary**:
- Vision Statement cho cuộc đời tài chính
- Mission & Values
- Strategic objectives
- Expected outcomes

**Hồ sơ cá nhân & bối cảnh**:
- Họ tên: ${userInfo.full_name}
- Ngày sinh: ${userInfo.birth_date} (Cung ${zodiac}, Life Path ${lifePath})
- Địa điểm: ${userInfo.location}
- Background: Phân tích sâu lịch sử nghề nghiệp
- Personality profile qua thông tin chat
- Financial DNA analysis

## 3️⃣ PHÂN TÍCH SWOT NÂNG CAO
Sử dụng framework:
- SWOT matrix 4x4 chi tiết
- TOWS strategies (SO, WO, ST, WT)
- Competitive positioning
- Blue ocean opportunities
Format bảng chuẩn với data cụ thể VN 2025

## 4️⃣ MỤC TIÊU SMART CHI TIẾT
**S**pecific: [Rõ ràng từng mục tiêu]
**M**easurable: [KPI cụ thể]
**A**chievable: [Phân tích khả thi]
**R**elevant: [Liên quan cuộc sống]
**T**ime-bound: [Deadline chính xác]

Phân tích sensitivity: ±20% scenarios

## 5️⃣ PHÂN TÍCH MỤC TIÊU & CHIẾN LƯỢC TỔNG THỂ
- Portfolio approach to goals
- Risk-return optimization
- Capital allocation strategy
- Hedging strategies
- Exit strategies cho từng mục tiêu

## 6️⃣ MINDMAP LỘ TRÌNH MASTER
Mermaid mindmap phức tạp:
- Central node: Ultimate goal
- Level 1: Yearly milestones
- Level 2: Quarterly objectives
- Level 3: Monthly actions
- Level 4: Weekly tasks

## 7️⃣ TIMELINE CHI TIẾT (Gantt Chart)
Mermaid gantt với dependencies

## 8️⃣ CHIẾN LƯỢC HÀNH ĐỘNG CHUYÊN SÂU
Cho mỗi mục tiêu:
- Strategic approach
- Tactical execution
- Resource requirements
- Risk mitigation
- Success metrics
- Contingency plans

## 9️⃣ VIỆC CẦN LÀM CHI TIẾT
Matrix Eisenhower:
- Urgent & Important
- Not Urgent & Important
- Urgent & Not Important
- Not Urgent & Not Important

Với timeline và responsible person

## 🔟 YẾU TỐ THÀNH CÔNG CRITICAL
**Hard factors**:
- Technical skills needed
- Capital requirements
- Market conditions
- Legal requirements

**Soft factors**:
- Emotional intelligence
- Network effects
- Timing factors
- Luck factor mitigation

## 1️⃣1️⃣ KỸ NĂNG & EXPERTISE ROADMAP
Skill acquisition plan:
| Skill | Current Level | Target Level | Learning Path | Time | Cost | ROI |
|-------|--------------|--------------|---------------|------|------|-----|
[10+ skills với data đầy đủ]

## 1️⃣2️⃣ KẾ HOẠCH TÍCH LŨY TÀI SẢN
- Asset accumulation strategy
- Diversification plan
- Rebalancing schedule
- Tax optimization
- Estate planning basics

## 1️⃣3️⃣ KẾ HOẠCH ĐẦU TƯ & QUẢN TRỊ RỦI RO
**Investment Strategy**:
- Asset allocation (stocks, bonds, real estate, crypto, gold)
- Vietnam specific: VN-Index, corporate bonds, land
- International diversification
- DCA vs Lump sum analysis

**Risk Management**:
- VaR calculation
- Stress testing
- Insurance planning
- Emergency fund sizing

## 1️⃣4️⃣ MÔ HÌNH KINH DOANH CÁ NHÂN HÓA
Top 3-5 business models phù hợp:
1. **Model A**: [Tên cụ thể]
   - Business plan summary
   - Startup costs
   - Revenue projections
   - 12-month roadmap
   - Key success factors

2. **Model B**: [Chi tiết tương tự]
3. **Model C**: [Chi tiết tương tự]

## 1️⃣5️⃣ KẾ HOẠCH THEO TIMELINE
**YEARLY PLAN**:
Year 1: [Objectives + KPIs]
Year 2: [Objectives + KPIs]
Year 3+: [Long-term vision]

**QUARTERLY BREAKDOWN**:
Q1: [Specific goals + actions]
Q2-Q4: [Details]

**MONTHLY CHECKLIST**:
Months 1-12: [Detailed actions]

**WEEKLY ROUTINES**:
Monday-Sunday schedule

**DAILY HABITS**:
Morning routine for wealth

## 1️⃣6️⃣ CHECKLIST HÀNH ĐỘNG
Comprehensive tables:
| Thời gian | Hành động | Priority | Resources | Link tài liệu |
|-----------|-----------|----------|-----------|---------------|
[30+ rows với data thực]

## 1️⃣7️⃣ GOOGLE SHEETS TỰ ĐỘNG (${tier === 'pro' || tier === 'premium' ? 'ENABLED' : 'Upgrade để có'})
Cấu trúc 7 sheets:
**Sheet 1: Dashboard**
- Income/Expense charts
- Net worth tracker
- Goal progress bars

**Sheet 2: Roadmap**
- Timeline với conditional formatting
- Milestone tracker
- Gantt view

**Sheet 3: Checklist**
- Auto % completion
- Color coding
- Email reminders

**Sheet 4: Savings Tracker**
- Monthly savings goals
- Actual vs planned
- Compound interest calculator

**Sheet 5: Income Growth**
- Multiple income streams
- Growth projections
- Scenario analysis

**Sheet 6: Business Metrics**
- MRR, ARR, Churn
- CAC, LTV, Payback
- Burn rate, Runway

**Sheet 7: Learning Resources**
- Skills matrix
- Course links
- Progress tracker

## 1️⃣8️⃣ TÀI LIỆU HỌC TẬP COMPREHENSIVE
${tier === 'basic' ? '25' : tier === 'pro' ? '45' : '60'}+ resources:
Categorized by:
- Finance & Investing
- Business & Entrepreneurship
- Skills & Technology
- Mindset & Psychology
- Industry Specific

Format: | # | Category | Title | Type | Link | Duration | Why Important |

## 1️⃣9️⃣ DỰ BÁO 3 KỊCH BẢN
**WORST CASE** (20% probability):
- Scenario description
- Impact analysis
- Mitigation strategies
- Recovery plan

**BASE CASE** (60% probability):
- Expected outcomes
- Key assumptions
- Success metrics

**BEST CASE** (20% probability):
- Upside potential
- Acceleration strategies
- Wealth multiplication

## 2️⃣0️⃣ CHIẾN LƯỢC GIẢM RỦI RO
- Diversification strategy
- Hedging instruments
- Insurance planning
- Legal protections
- Relationship management
- Health & wellness plan

## 2️⃣1️⃣ PHÂN TÍCH TỬ VI & THẦN SỐ HỌC
**Tử vi ${zodiac}**:
- Đặc điểm tài chính của cung ${zodiac}
- Năm ${new Date().getFullYear()}: Vận trình tài lộc
- Tháng tốt/xấu cho đầu tư
- Hướng nhà/văn phòng tốt
- Màu sắc & con số may mắn

**Thần số học (Life Path ${lifePath})**:
- Ý nghĩa con số ${lifePath}
- Nghề nghiệp phù hợp
- Partner compatibility
- Lucky periods
- Financial karma

**Tư vấn phong thủy tài chính**:
- Bố trí không gian làm việc
- Wealth corners activation
- Lucky charms & symbols

## 2️⃣2️⃣ TÓM TẮT TOÀN BỘ KẾ HOẠCH
Executive summary:
- 10 key points
- Critical success factors
- Major milestones
- Expected ROI

## 2️⃣3️⃣ HƯỚNG DẪN SỬ DỤNG
**How to use this plan**:
1. Daily: Check daily habits
2. Weekly: Review weekly goals
3. Monthly: Update progress
4. Quarterly: Major review
5. Yearly: Strategic adjustment

**Tools & Apps recommended**:
- Finance: Mint, YNAB, Money Lover
- Productivity: Notion, Todoist
- Investment: Trading apps
- Learning: Coursera, Udemy

## 2️⃣4️⃣ KẾT LUẬN & HÀNH ĐỘNG
**Lời khuyên từ chuyên gia**:
- Top 5 principles for wealth
- Common mistakes to avoid
- Success stories similar profile

**Call to Action**:
"Bắt đầu NGAY HÔM NAY với 3 việc:
1. [Specific action]
2. [Specific action]
3. [Specific action]"

**Motivation quote cá nhân hóa**

📝 FORMAT OUTPUT:
{
  "title": "[Creative title]",
  "tier": "${tier}",
  "content_markdown": "[24 sections content]",
  "mermaid_blocks": ["mindmap", "gantt", "flowchart"],
  "tables_md": ["10+ tables"],
  "sheets_spec": {
    "enabled": ${tier === 'pro' || tier === 'premium'},
    "sheets": [7 sheet definitions]
  },
  "resources": [${tier === 'basic' ? '25' : tier === 'pro' ? '45' : '60'} resources]
}
`
}

/**
 * Main function to get plan prompt
 */
export function getPlanPromptV3(tier: string, constraints: any, userInfo: any) {
  // Data validation first
  const validationPrompt = `
⚠️ BƯỚC 1: KIỂM TRA & XÁC MINH DỮ LIỆU (BẮT BUỘC)

Trước khi lập kế hoạch, PHẢI thực hiện:
1. **Extract tất cả thông tin** user cung cấp
2. **Phân loại**: 
   - CURRENT STATE: Thu nhập, tiết kiệm HIỆN CÓ
   - GOALS: Mục tiêu MUỐN ĐẠT
   - Lưu ý: "có tài khoản tiết kiệm X tỷ" = MỤC TIÊU, không phải hiện có!
3. **Validate số học**:
   - Tổng mục tiêu = sum(các mục tiêu con)
   - Gap = Tổng mục tiêu - Tiết kiệm hiện có
   - Tiền cần/tháng = Gap ÷ Số tháng
4. **Cross-check logic**:
   - Thu nhập hiện tại có đủ để tiết kiệm?
   - Timeline có khả thi?
   - Có mâu thuẫn trong data không?
5. **Điền thông tin thiếu**:
   - Nếu thiếu age → estimate từ context
   - Nếu thiếu location → assume TP.HCM/Hà Nội
   - Nếu thiếu income → estimate từ nghề nghiệp
`

  // Get tier-specific prompt
  let mainPrompt = ''
  if (tier === 'free') {
    mainPrompt = getFreeTierPrompt(userInfo)
  } else {
    mainPrompt = getPremiumTierPrompt(userInfo, tier)
  }

  // Quality guidelines
  const qualityGuidelines = `
🎯 NGUYÊN TẮC VÀNG:
1. **Thông minh tuyệt đối**: Phân tích sâu, insight độc đáo
2. **Cá nhân hóa 100%**: Mọi lời khuyên phải fit với user
3. **Số liệu chính xác**: Double-check mọi con số
4. **Hành động cụ thể**: Executable trong 24h
5. **Giá trị thực**: Phải thay đổi được cuộc đời user

✅ CHECKLIST CHẤT LƯỢNG:
□ Data validation hoàn chỉnh
□ Không placeholder, chỉ data thực
□ Markdown tables format chuẩn
□ Mermaid syntax chính xác
□ Links hoạt động 100%
□ Tính toán không sai sót
□ Logic nhất quán xuyên suốt
□ Ngôn ngữ ấm áp, chuyên nghiệp

🚫 TUYỆT ĐỐI TRÁNH:
- Generic advice
- Copy paste content
- Broken links or tables
- Math errors
- Logic contradictions
- Missing critical info
- Placeholder text ("...", "---", "TBD")
`

  return validationPrompt + mainPrompt + qualityGuidelines
}

/**
 * Generate user context with enhanced extraction
 */
export function getUserContextEnhanced(collectedInfo: any) {
  const context = `
📋 THÔNG TIN NGƯỜI DÙNG (ĐÃ XÁC MINH):

**Profile cơ bản**:
- Họ tên: ${collectedInfo.full_name || 'Chưa cung cấp'}
- Ngày sinh: ${collectedInfo.birth_date || 'Chưa cung cấp'}
- Tuổi: ${collectedInfo.age || 'Ước tính 25-35'}
- Giới tính: ${collectedInfo.gender || 'Chưa xác định'}
- Tình trạng hôn nhân: ${collectedInfo.marital_status || 'Chưa cung cấp'}
- Số người phụ thuộc: ${collectedInfo.dependents || '0'}

**Tài chính hiện tại**:
- Thu nhập chính: ${collectedInfo.income || 0} VNĐ/tháng
- Thu nhập phụ: ${collectedInfo.side_income || 0} VNĐ/tháng
- Tiết kiệm hiện có: ${collectedInfo.savings || 0} VNĐ
- Nợ hiện tại: ${collectedInfo.debt || 0} VNĐ
- Chi tiêu hàng tháng: ${collectedInfo.expenses || 'Chưa cung cấp'}
- Tài sản hiện có: ${collectedInfo.assets || 'Chưa có'}

**Nghề nghiệp & kỹ năng**:
- Nghề hiện tại: ${collectedInfo.occupation || 'Chưa cung cấp'}
- Kinh nghiệm: ${collectedInfo.experience || 'Chưa cung cấp'} năm
- Ngành nghề: ${collectedInfo.industry || 'Chưa xác định'}
- Kỹ năng chính: ${collectedInfo.skills || 'Cần khám phá'}
- Học vấn: ${collectedInfo.education || 'Đại học'}
- Chứng chỉ: ${collectedInfo.certifications || 'Chưa có'}

**Mục tiêu tài chính**:
${collectedInfo.goal || 'Chưa xác định cụ thể'}

**Chi tiết mục tiêu**:
- Timeline: ${collectedInfo.timeline || '12-36 tháng'}
- Mức độ ưu tiên: ${collectedInfo.priority || 'Cao'}
- Lý do: ${collectedInfo.motivation || 'Cải thiện cuộc sống'}

**Tâm lý & sẵn sàng**:
- Risk tolerance: ${collectedInfo.risk_tolerance || 'Trung bình'}
- Mức độ cam kết: ${collectedInfo.readiness || '7/10'}
- Kinh nghiệm đầu tư: ${collectedInfo.investment_experience || 'Beginner'}
- Thời gian dành cho học: ${collectedInfo.learning_time || '2-3h/tuần'}

**Bối cảnh & môi trường**:
- Địa điểm: ${collectedInfo.location || 'TP.HCM/Hà Nội'}
- Loại hình nhà ở: ${collectedInfo.housing || 'Thuê nhà'}
- Phương tiện: ${collectedInfo.transportation || 'Xe máy'}
- Support system: ${collectedInfo.support || 'Gia đình'}

**Thông tin bổ sung từ chat**:
${collectedInfo.additional_notes || 'Phân tích context từ cuộc trò chuyện'}

⚠️ DATA VALIDATION RESULTS:
- Total goals amount: [TÍNH TOÁN]
- Current savings: ${collectedInfo.savings || 0} VNĐ
- Gap to achieve: [TÍNH TOÁN]
- Monthly savings needed: [TÍNH TOÁN]
- Feasibility check: [ĐÁNH GIÁ]
`
  return context
}
