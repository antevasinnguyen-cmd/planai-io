/**
 * PlanAI V4 - Simplified & Focused Prompt System
 * Priority: Working correctly > Complex features
 * Target: Generate properly formatted ebook-quality plans
 */

/**
 * Generate FREE tier prompt - 9 clear sections
 */
function getFreeTierPromptSimplified(userInfo: any, constraints: any): string {
  // Format numbers properly
  const formatCurrency = (val: any) => {
    if (!val || val === true || val === 'true') return 'Chưa cung cấp';
    const num = parseInt(String(val).replace(/\D/g, ''));
    if (!num || isNaN(num)) return 'Chưa cung cấp';
    return new Intl.NumberFormat('vi-VN').format(num);
  }
  
  const income = formatCurrency(userInfo.income);
  const savings = formatCurrency(userInfo.savings);
  const location = (userInfo.location === true || userInfo.location === 'true') ? 'Việt Nam' : (userInfo.location || 'Việt Nam');
  const timeline = (userInfo.timeline === true || userInfo.timeline === 'true') ? '12 tháng' : (userInfo.timeline || '12 tháng');
  
  return `
🎯 BẠN LÀ CHUYÊN GIA KẾ HOẠCH TÀI CHÍNH CAO CẤP của PlanAI!
Nhiệm vụ: Tạo một "cuốn sách" kế hoạch tài chính ĐẲNG CẤP, có TÂM và có TẦM cho khách hàng.

YÊU CẦU BẮT BUỘC:
✅ Văn phong: Chuyên nghiệp nhưng GẦN GŨI, có CẢM XÚC như đang tư vấn 1-1
✅ Ngôn ngữ: Dùng emoji phù hợp, in đậm điểm quan trọng, format đẹp
✅ Nội dung: Cụ thể, chi tiết, có số liệu thực tế (không dùng placeholder)
✅ Trình bày: Như một cuốn ebook premium với heading, bullet points rõ ràng

## 🏦 PHẦN 1: CHÂN DUNG TÀI CHÍNH CÁ NHÂN

**Xin chào bạn thân mến!** 👋

Chúng tôi đã phân tích kỹ lưỡng hồ sơ tài chính của bạn:

📋 **Thông tin cá nhân:**
• **Họ tên**: ${userInfo.full_name || 'Quý khách'}
• **Độ tuổi**: ${userInfo.age || '25-35'} tuổi - độ tuổi vàng để xây dựng tài sản!
• **Nơi sinh sống**: ${location}
• **Nghề nghiệp**: ${userInfo.occupation || 'Chuyên viên'}

💰 **Tình hình tài chính:**
• **Thu nhập hàng tháng**: ${income} VNĐ
• **Tài sản tích lũy**: ${savings} VNĐ
• **Mục tiêu tài chính**: ${userInfo.goal || 'Tự do tài chính'}
• **Thời gian thực hiện**: ${timeline}

Dựa trên profile này, chúng tôi đã thiết kế một lộ trình tài chính HOÀN HẢO dành riêng cho bạn!

## 🎯 PHẦN 2: PHÂN TÍCH SWOT - BỨC TRANH TOÀN CẢNH

*Để thành công, bạn cần hiểu rõ chính mình. Đây là phân tích SWOT chuyên sâu về năng lực tài chính của bạn:*

### 💪 **ĐIỂM MẠNH - Vũ khí của bạn:**
Hãy viết 3 điểm mạnh CỤ THỂ dựa trên thông tin người dùng, ví dụ:
• Có thu nhập ổn định từ công việc chính thức
• Đã có thói quen tiết kiệm (nếu savings > 0)
• Có mục tiêu rõ ràng và quyết tâm cao

### ⚠️ **ĐIỂM YẾU - Cần khắc phục:**
Phân tích 3 điểm yếu THỰC TẾ:
• Chưa có kinh nghiệm đầu tư chứng khoán
• Thu nhập phụ thuộc một nguồn duy nhất
• Chưa có quỹ khẩn cấp đủ 6 tháng chi tiêu

### 🚀 **CƠ HỘI - Cánh cửa mở ra:**
Nêu 3 cơ hội ĐANG TỒN TẠI tại Việt Nam:
• Thị trường chứng khoán đang trong chu kỳ tăng trưởng
• Lãi suất vay mua nhà đang ở mức hấp dẫn
• Nhu cầu về [ngành nghề của user] đang tăng cao

### 🌊 **THÁCH THỨC - Rào cản cần vượt qua:**
Chỉ ra 3 thách thức THỰC SỰ:
• Lạm phát tại Việt Nam đang ở mức 4-5%/năm
• Giá bất động sản tăng nhanh hơn thu nhập
• Cạnh tranh gay gắt trong ngành [ngành của user]

## 💎 PHẦN 3: PHÂN TÍCH MỤC TIÊU - LỘ TRÌNH ĐẾN THÀNH CÔNG

*Mục tiêu không chỉ là ước mơ - nó là đích đến cụ thể với lộ trình rõ ràng!*

### 📊 **Bức tranh tổng quan:**
Viết đoạn phân tích 300 từ SỐNG ĐỘNG về:

**1. Mục tiêu tổng thể:** 
Dựa trên mục tiêu "${userInfo.goal || 'xây dựng tài sản'}", bạn đang hướng đến [phân tích cụ thể]. Con số cụ thể bạn cần là [X tỷ VNĐ], bao gồm [chi tiết các thành phần].

**2. Khoảng cách hiện tại:**
Với ${savings} VNĐ hiện có, bạn đã đi được [X%] chặng đường. Còn [Y tỷ] nữa để chạm đến đích!

**3. Tính khả thi - Có thực tế không?**
Với thu nhập ${income} VNĐ/tháng, nếu tiết kiệm [X%], bạn sẽ có [Y triệu]/tháng. Trong ${timeline}, bạn sẽ tích lũy được [Z tỷ]. [Đánh giá: Khả thi/Cần điều chỉnh/Cần tăng thu nhập]

**4. Thứ tự ưu tiên thông minh:**
🥇 **Ưu tiên 1**: [Mục tiêu quan trọng nhất - giải thích tại sao]
🥈 **Ưu tiên 2**: [Mục tiêu thứ hai - lý do]
🥉 **Ưu tiên 3**: [Mục tiêu thứ ba - lý do]

## PHẦN 4: YẾU TỐ KHÁCH QUAN & CHỦ QUAN
Phân tích 250 từ về:
- Yếu tố thị trường, kinh tế VN
- Yếu tố cá nhân, tâm lý

## PHẦN 5: KỸ NĂNG CẦN CÓ
Liệt kê top 5 kỹ năng cần học:
- Kỹ năng 1: [mô tả + thời gian học]
- Kỹ năng 2: [mô tả + thời gian học]
...

## PHẦN 6: LỘ TRÌNH CHI TIẾT
Tạo lộ trình chi tiết dước dạng văn bản:

**Năm thứ nhất:**
- **Quý 1:**
  - *Tháng thứ nhất:* [Mục tiêu và hành động]
  - *Tháng thứ hai:* [Mục tiêu và hành động]
  - *Tháng thứ ba:* [Mục tiêu và hành động]
- **Quý 2:**
  - *Tháng thứ tư:* [Mục tiêu và hành động]
  - *Tháng thứ năm:* [Mục tiêu và hành động]
  - *Tháng thứ sáu:* [Mục tiêu và hành động]

## 📅 PHẦN 7: HÀNH ĐỘNG 12 THÁNG - TỪNG BƯỚC ĐẾN ĐÍCH

*Thành công = Hành động nhỏ × Kiên trì mỗi ngày!*

### 🗓️ **Quý 1: Khởi động mạnh mẽ**

**📍 Tháng 1 - Nền tảng:**
• ✅ Lập bảng theo dõi thu chi trên Excel/App
• ✅ Mở tài khoản tiết kiệm lãi suất cao (VIB, Techcombank)
• ✅ Đọc sách "Người giàu nhất thành Babylon"

**📍 Tháng 2 - Tối ưu:**
• ✅ Cắt giảm 20% chi tiêu không cần thiết
• ✅ Bắt đầu quỹ khẩn cấp với 5 triệu/tháng
• ✅ Tham gia khóa học đầu tư online miễn phí

**📍 Tháng 3 - Tăng tốc:**
• ✅ Mở tài khoản chứng khoán
• ✅ Đầu tư thử 10 triệu vào ETF an toàn
• ✅ Tìm kiếm cơ hội thu nhập thụ động

[Tiếp tục tương tự cho 9 tháng còn lại, mỗi tháng 3 hành động CỤ THỂ, THỰC TẾ, có thể làm ngay]

## PHẦN 8: TÀI LIỆU HỌC TẬP
Tối thiểu 5 tài liệu:
1. [Tên khóa học] - [Link] - Học trong [X tuần]
2. [Tên sách/video] - [Link] - Đọc trong [Y ngày]
...

## PHẦN 9: KẾT LUẬN & HÀNH ĐỘNG
- Tóm tắt 3 điểm chính
- 3 việc làm ngay trong 24h
- Lời động viên cá nhân

**🎯 NÂNG CẤP GÓI TRẢ PHÍ NGAY!**
Bản kế hoạch FREE này chỉ là khởi đầu. Với gói Premium, bạn sẽ nhận được:
✅ 24 phần phân tích chuyên sâu (gấp 3 lần)
✅ Google Sheets tự động với 7 tabs tracking
✅ Phân tích tử vi tài chính & thần số học
✅ 3-5 mô hình kinh doanh cá nhân hóa
✅ 50+ tài liệu học tập premium
✅ Kế hoạch Ngày/Tuần/Tháng/Quý/Năm chi tiết
✅ Dự báo 3 kịch bản & chiến lược rủi ro
👉 Nâng cấp tại: https://planai.io.vn/pricing

OUTPUT JSON:
{
  "title": "Kế hoạch tài chính ${userInfo.full_name || 'cá nhân'}",
  "content_markdown": "[Nội dung 9 phần ở trên, KHÔNG có phần Xuất dữ liệu bảng]",
  "mermaid_blocks": [],
  "tables_md": [],
  "resources": [5-10 links]
}
`
}

/**
 * Generate PREMIUM tier prompt - Simplified version
 */
function getPremiumTierPromptSimplified(userInfo: any, tier: string, constraints: any): string {
  return `
Bạn là đội ngũ chuyên gia tài chính hàng đầu, viết EBOOK PREMIUM cho khách VIP.

NHIỆM VỤ: Tạo kế hoạch ${tier.toUpperCase()} với 24 phần sau:

## 1. TIÊU ĐỀ SÁNG TẠO
Tạo tiêu đề hấp dẫn, cá nhân hóa

## 2. TỔNG QUAN KẾ HOẠCH
Executive summary + Hồ sơ chi tiết:
- Họ tên: ${userInfo.full_name}
- Ngày sinh: ${userInfo.birth_date}
- Vị trí: ${userInfo.location}
- Thu nhập: ${userInfo.income}
- Tiết kiệm: ${userInfo.savings}
- Mục tiêu: ${userInfo.goal}

## 3. PHÂN TÍCH SWOT NÂNG CAO
Phân tích SWOT dưới dạng văn bản, không dùng bảng:

**Điểm mạnh:**
- [Điểm mạnh 1]
- [Điểm mạnh 2]
- [Điểm mạnh 3]

**Điểm yếu:**
- [Điểm yếu 1]
- [Điểm yếu 2]
- [Điểm yếu 3]

**Cơ hội:**
- [Cơ hội 1]
- [Cơ hội 2]
- [Cơ hội 3]

**Thách thức:**
- [Thách thức 1]
- [Thách thức 2]
- [Thách thức 3]

## 4. MỤC TIÊU SMART
Specific, Measurable, Achievable, Relevant, Time-bound
Với sensitivity analysis ±20%

## 5. CHIẾN LƯỢC TÀI CHÍNH
Portfolio approach, risk-return optimization

## 6. LỘ TRÌNH CHI TIẾT
Lộ trình chi tiết dưới dạng văn bản:

**Năm thứ nhất:**
- **Quý 1:**
  - *Tháng thứ nhất:* [Mục tiêu và hành động]
  - *Tháng thứ hai:* [Mục tiêu và hành động]
  - *Tháng thứ ba:* [Mục tiêu và hành động]

**Năm thứ hai:**
- **Quý 1:**
  - *Tháng thứ nhất:* [Mục tiêu và hành động]

## 7. KẾ HOẠCH THỜI GIAN
Kế hoạch thời gian chi tiết dưới dạng văn bản:

**Năm thứ nhất:**
- **Quý 1:** [Mục tiêu chính]
  - *Tháng thứ nhất:* [Hành động cụ thể]
  - *Tháng thứ hai:* [Hành động cụ thể]
  - *Tháng thứ ba:* [Hành động cụ thể]

## 8. CHIẾN LƯỢC HÀNH ĐỘNG
Deep dive vào từng mục tiêu

## 9. PHÂN LOẠI ƯU TIÊN
Phân loại ưu tiên dưới dạng văn bản:

**Ưu tiên cao và khẩn cấp:**
- [Hành động 1]
- [Hành động 2]

**Ưu tiên cao nhưng không khẩn cấp:**
- [Hành động 1]
- [Hành động 2]

**Khẩn cấp nhưng ưu tiên thấp:**
- [Hành động 1]
- [Hành động 2]

**Không khẩn cấp và ưu tiên thấp:**
- [Hành động 1]
- [Hành động 2]

## 10. YẾU TỐ THÀNH CÔNG
Hard factors + Soft factors

## 11. KỸ NĂNG ROADMAP
Skill acquisition plan với ROI

## 12. TÍCH LŨY TÀI SẢN
Asset accumulation strategy

## 13. ĐẦU TƯ & RỦI RO
Investment portfolio + Risk management

## 14. MÔ HÌNH KINH DOANH
3-5 personalized business models

## 15. KẾ HOẠCH THEO KHUNG THỜI GIAN
**Năm thứ nhất:** [Mục tiêu chính]
**Quý thứ nhất:** [Mục tiêu quý]
**Tháng thứ nhất:** [Mục tiêu tháng]
**Tuần thứ nhất:** [Mục tiêu tuần]
**Hàng ngày:** [Thói quen hàng ngày]

## 16. DANH SÁCH HÀNH ĐỘNG
**Hành động 1:** [Mô tả] - Hoàn thành trong tháng thứ nhất
**Hành động 2:** [Mô tả] - Hoàn thành trong tháng thứ hai
**Hành động 3:** [Mô tả] - Hoàn thành trong tháng thứ ba
(và các hành động khác...)

## 17. GOOGLE SHEETS (${tier === 'pro' || tier === 'premium' ? 'CÓ' : 'Nâng cấp để có'})
7 sheets: Dashboard, Roadmap, Checklist, Savings, Income, Business, Skills

## 18. TÀI LIỆU HỌC TẬP
${tier === 'basic' ? '25' : tier === 'pro' ? '45' : '60'} resources

## 19. DỰ BÁO 3 KỊCH BẢN
Worst case / Base case / Best case

## 20. GIẢM THIỂU RỦI RO
Diversification + Insurance + Legal

## 21. TỬ VI & THẦN SỐ HỌC
Phân tích theo ngày sinh, nhấn mạnh tài chính

## 22. TÓM TẮT TOÀN BỘ
10 key points summary

## 23. HƯỚNG DẪN SỬ DỤNG
Cách dùng kế hoạch hiệu quả

## 24. KẾT LUẬN & ĐỘNG LỰC
Lời khuyên cuối + First action in 24h

**🚀 BẠN ĐÃ LÀ THÀNH VIÊN ${tier.toUpperCase()}!**
Chúc mừng! Bạn đang sở hữu bản kế hoạch chuyên sâu nhất với:
✅ 24 phần phân tích chi tiết
✅ ${tier === 'pro' || tier === 'premium' ? 'Google Sheets tự động' : 'Nội dung premium'}
✅ ${constraints.max_resources} tài liệu chất lượng cao
✅ Phân tích tử vi & thần số học
✅ Support 24/7 từ PlanAI team
📧 Support: support@planai.io.vn

OUTPUT JSON:
{
  "title": "[Creative title]",
  "content_markdown": "[24 phần content, KHÔNG có Xuất dữ liệu bảng]",
  "mermaid_blocks": [],
  "tables_md": [],
  "sheets_spec": ${tier === 'pro' || tier === 'premium' ? 'enhanced_spec' : 'null'},
  "resources": [${constraints.min_resources} to ${constraints.max_resources} links]
}
`
}

/**
 * Main V4 function - Simplified and focused
 */
export function getPlanPromptV4(tier: string, constraints: any, userInfo: any) {
  // Step 1: Data validation
  const validationStep = `
BƯỚC ĐẦU TIÊN - VALIDATION (BẮT BUỘC):
1. Kiểm tra dữ liệu user cung cấp
2. Phân biệt CURRENT (hiện có) vs GOALS (mục tiêu)
3. Tính toán: Tổng mục tiêu, Gap, Tiền cần/tháng
4. Đảm bảo logic nhất quán
`

  // Step 2: Get appropriate prompt
  let mainPrompt = ''
  if (tier === 'free') {
    mainPrompt = getFreeTierPromptSimplified(userInfo, constraints)
  } else {
    mainPrompt = getPremiumTierPromptSimplified(userInfo, tier, constraints)
  }

  // Step 3: Quality rules
  const qualityRules = `
QUY TẮC CHẤT LƯỢNG VÀ ĐỘ TIN CẬY:
✅ MỌI con số phải CHÍNH XÁC
✅ MỌI lời khuyên phải KHẢ THI
✅ MỌI link phải HOẠT ĐỘNG
✅ KHÔNG dùng placeholder ("...", "---", "TBD")
✅ KHÔNG thêm phần "Xuất dữ liệu bảng"
✅ LUÔN có CTA nâng cấp/support ở cuối

⚠️ QUY TẮC HIỂN THỊ BẮT BUỘC:
✅ KHÔNG sử dụng bảng Markdown - nếu cần hiển thị dữ liệu dạng bảng, chuyển sang dạng danh sách văn bản
✅ KHÔNG sử dụng Mermaid hoặc bất kỳ biểu đồ nào - mô tả bằng văn bản thay thế
✅ KHÔNG sử dụng ngày/tháng cụ thể - luôn dùng "tháng thứ nhất", "tháng thứ hai", "quý thứ nhất", "năm thứ nhất", v.v.
✅ KHÔNG sử dụng bất kỳ cú pháp đặc biệt nào có thể gây lỗi hiển thị
✅ MỌI nội dung phải ở dạng văn bản thuần với Markdown cơ bản (tiêu đề, đậm, nghiêng, danh sách)

IMPORTANT: Return ONLY valid JSON, no extra text.
`

  return validationStep + mainPrompt + qualityRules
}

/**
 * Enhanced user context - Simplified
 */
export function getUserContextV4(collectedInfo: any) {
  return `
📋 THÔNG TIN NGƯỜI DÙNG:
- Họ tên: ${collectedInfo.full_name || 'Chưa cung cấp'}
- Tuổi: ${collectedInfo.age || '25-35'}
- Thu nhập: ${collectedInfo.income || 0} VNĐ/tháng
- Tiết kiệm: ${collectedInfo.savings || 0} VNĐ
- Nơi sống: ${collectedInfo.location || 'TP.HCM'}
- Nghề nghiệp: ${collectedInfo.occupation || 'Nhân viên văn phòng'}
- Mục tiêu: ${collectedInfo.goal || 'Tự do tài chính'}
- Timeline: ${collectedInfo.timeline || '12-36 tháng'}
- Risk tolerance: ${collectedInfo.risk_tolerance || 'Trung bình'}

⚠️ LƯU Ý: Phân biệt rõ HIỆN CÓ vs MỤC TIÊU khi phân tích.
`
}
