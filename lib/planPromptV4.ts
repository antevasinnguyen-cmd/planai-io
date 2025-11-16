/**
 * PlanAI V4 - Simplified & Focused Prompt System
 * Priority: Working correctly > Complex features
 * Target: Generate properly formatted ebook-quality plans
 */

/**
 * Generate FREE tier prompt - 9 clear sections
 */
function getFreeTierPromptSimplified(userInfo: any, constraints: any): string {
  // Parse Vietnamese currency-like inputs robustly (e.g., "3 tỷ", "800 triệu", "10tr", "7-10 triệu")
  const toNumberVND = (val: any): number | null => {
    if (val === null || val === undefined || val === true || val === 'true' || val === false) return null;
    let s = String(val).toLowerCase().trim();
    // Handle ranges like "7-10 triệu" -> take lower bound
    if (s.includes('-')) s = s.split('-')[0];
    let multiplier = 1;
    if (s.includes('tỷ') || s.includes('ty') || s.includes('bn')) multiplier = 1_000_000_000;
    else if (s.includes('triệu') || s.includes('trieu') || s.includes('tr') || /\bmi?l?\b/.test(s)) multiplier = 1_000_000;
    else if (s.includes('nghìn') || s.includes('nghin') || s.includes('k')) multiplier = 1_000;
    // Keep only digits, dot, comma
    const cleaned = s.replace(/[^0-9.,]/g, '');
    if (!cleaned) return null;
    // Normalize: remove thousand separators, unify decimal
    const normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(normalized);
    if (isNaN(num) || num <= 0) return null;
    return Math.round(num * multiplier);
  };

  const formatCurrency = (val: any) => {
    const n = toNumberVND(val);
    if (n === null) return 'Chưa cung cấp';
    return new Intl.NumberFormat('vi-VN').format(n);
  }
  
  const income = formatCurrency(userInfo.income);
  const savings = formatCurrency(userInfo.savings);
  const location = (userInfo.location && userInfo.location !== true && userInfo.location !== 'true') ? String(userInfo.location) : 'Chưa cung cấp';
  const timeline = (userInfo.timeline && userInfo.timeline !== true && userInfo.timeline !== 'true') ? String(userInfo.timeline) : 'Chưa cung cấp';
  const goalVal = (userInfo.goal && userInfo.goal !== true && userInfo.goal !== 'true') ? String(userInfo.goal) : 'Chưa cung cấp'

  // Helpers to only include provided fields
  const onlyIf = (label: string, value: string) => (value && value !== 'Chưa cung cấp') ? `• **${label}**: ${value}` : ''
  const personalSummary = [
    onlyIf('Họ tên', userInfo.full_name),
    onlyIf('Độ tuổi', String(userInfo.age || '')),
    onlyIf('Nơi sinh sống', location),
    onlyIf('Nghề nghiệp', userInfo.occupation)
  ].filter(Boolean).join('\n')
  const financeSummary = [
    onlyIf('Thu nhập hàng tháng', income !== 'Chưa cung cấp' ? `${income} VNĐ` : ''),
    onlyIf('Tài sản tích lũy', savings !== 'Chưa cung cấp' ? `${savings} VNĐ` : ''),
    onlyIf('Mục tiêu tài chính', goalVal),
    onlyIf('Thời gian thực hiện', timeline)
  ].filter(Boolean).join('\n')
  
  return `
🎯 BẠN LÀ CHUYÊN GIA KẾ HOẠCH TÀI CHÍNH CAO CẤP của PlanAI!
Nhiệm vụ: Tạo một "cuốn sách" kế hoạch tài chính ĐẲNG CẤP, có TÂM và có TẦM cho khách hàng.

YÊU CẦU BẮT BUỘC:
✅ Văn phong: Chuyên nghiệp nhưng GẦN GŨI, có CẢM XÚC như đang tư vấn 1-1
✅ Ngôn ngữ: Dùng emoji phù hợp, in đậm điểm quan trọng, format đẹp
✅ Nội dung: Cụ thể, chi tiết, có số liệu thực tế (không dùng placeholder)
✅ Trình bày: Như một cuốn ebook premium với heading, bullet points rõ ràng
✅ ĐỘ DÀI: 4.000–5.000 từ cho bản FREE (chi tiết, đầy đủ, không cắt ngắn; nếu thiếu dữ liệu vẫn phải phân tích sâu theo giả định minh bạch)

## 🏦 PHẦN 1: CHÂN DUNG TÀI CHÍNH CÁ NHÂN

**Tóm tắt nhanh những gì bạn đã chia sẻ:**

${personalSummary ? `📋 **Thông tin cá nhân:**\n${personalSummary}` : ''}

${financeSummary ? `\n💰 **Tình hình tài chính:**\n${financeSummary}` : ''}

> Lưu ý: Các phần sau chỉ phân tích dựa trên dữ liệu có thật ở trên (không giả định thêm).

## 🎯 PHẦN 2: PHÂN TÍCH SWOT - BỨC TRANH TOÀN CẢNH

*Để thành công, bạn cần hiểu rõ chính mình. Đây là phân tích SWOT chuyên sâu về năng lực tài chính của bạn:*

### 💪 **ĐIỂM MẠNH - Vũ khí của bạn:**
Viết 3–5 điểm mạnh CỤ THỂ dựa trên các kỹ năng đã nêu (nếu có), kinh nghiệm, thu nhập hiện tại, dự án đang theo đuổi (ví dụ: SaaS AI), và vị trí sinh sống (ví dụ: Bắc Ninh).

### ⚠️ **ĐIỂM YẾU - Cần khắc phục:**
Chỉ ra 3–5 hạn chế liên quan trực tiếp đến mục tiêu (ví dụ: vốn ban đầu, dòng tiền thấp, thiếu kênh bán…). Đề xuất cách khắc phục ngắn gọn.

### 🚀 **CƠ HỘI - Cánh cửa mở ra:**
Nêu 3 cơ hội LIÊN QUAN TRỰC TIẾP tới mục tiêu của bạn. Tránh nhận định chung chung.

### 🌊 **THÁCH THỨC - Rào cản cần vượt qua:**
Chỉ ra 3 thách thức THỰC SỰ:
• Lạm phát tại Việt Nam đang ở mức 4-5%/năm
• Giá bất động sản tăng nhanh hơn thu nhập
• Cạnh tranh gay gắt trong ngành [ngành của user]

## 💎 PHẦN 3: PHÂN TÍCH MỤC TIÊU - LỘ TRÌNH ĐẾN THÀNH CÔNG

*Chỉ dựa trên dữ liệu bạn đã cung cấp. Không dùng placeholder. Nếu thiếu số dư tiết kiệm hiện có, **giả định 0 VNĐ để ước tính ban đầu** và ghi chú rõ ràng đây là giả định.*

### 📊 **Bức tranh tổng quan:**
Viết 500-600 từ với các mục sau, có số liệu rõ ràng:

**1. Mục tiêu tổng thể:** 
- Liệt kê ĐÚNG các mục tiêu bạn đã nêu, không thêm mục tiêu mới.

**2. Khoảng cách hiện tại (Gap):**
- Nếu có số tiền tiết kiệm hiện có: Gap = Tổng mục tiêu − Tiết kiệm hiện có.
- Nếu chưa có dữ liệu tiết kiệm: ghi chú "Giả định: tiết kiệm hiện có = 0 VNĐ" và tính Gap theo giả định này.

**3. Tính khả thi:**
- Nếu thu nhập là khoảng (ví dụ: 7–10 triệu/tháng) và thời gian là khoảng (ví dụ: 2–3 năm), hãy tính cả kịch bản MIN và MAX:
  - Quy đổi thời gian về tháng (ví dụ: 24–36 tháng).
  - Tiền cần/tháng (MIN, MAX) = Gap / số_tháng (MAX, MIN).
  - Tỷ lệ tiết kiệm cần thiết trên thu nhập (MIN, MAX) và nhận xét mức độ khả thi.
  - Nếu mục tiêu thu nhập tương lai được nêu (ví dụ: 1 tỷ/tháng từ SaaS), bổ sung kịch bản có/không đạt mục tiêu này.
/ Thu nhập.
  - Kết luận: Khả thi / Cần điều chỉnh / Cần tăng thu nhập (nêu lý do).
- Nếu thiếu dữ liệu: ghi rõ "Không đủ dữ liệu để đánh giá khả thi".

**4. Thứ tự ưu tiên thông minh:**
- Sắp xếp theo tiêu chí: Impact (tác động) / Cost (chi phí) / Time (thời gian). Không suy đoán nếu thiếu dữ liệu.

## PHẦN 4: YẾU TỐ KHÁCH QUAN & CHỦ QUAN
Viết 300-400 từ, CHỈ nêu các yếu tố ảnh hưởng TRỰC TIẾP tới mục tiêu đã cung cấp (ví dụ: lãi suất vay khi mục tiêu là mua nhà). Tránh nhận định chung chung. Nếu thiếu dữ liệu về mục tiêu, ghi rõ hạn chế.

## PHẦN 5: KỸ NĂNG & KINH NGHIỆM CẦN CÓ + MÔ HÌNH KINH DOANH GỢI Ý
1) Kỹ năng/kinh nghiệm cốt lõi (tối đa 6 mục): mỗi mục ghi rõ mục đích, ROI dự kiến, thời lượng khuyến nghị, tài nguyên học nhanh để bắt đầu NGAY hôm nay. Liên kết chặt với mục tiêu (ví dụ: tối ưu dòng tiền, đàm phán lãi suất, nghiện cứu thị trường, marketing, bán hàng, phân tích dữ liệu).
2) 3–5 mô hình tăng thu nhập phù hợp hồ sơ hiện tại (ví dụ: freelancing theo kỹ năng A, bán sản phẩm số, dịch vụ tư vấn niche, micro-SaaS, affiliate). Với mỗi mô hình: mô tả ngắn, nguồn lực cần, rủi ro, KPI 90 ngày, ví dụ giá/biên lợi nhuận tại VN.

## PHẦN 6: LỘ TRÌNH CHI TIẾT
Linh hoạt theo thời gian mục tiêu người dùng nêu ra:
- Nếu timeline là ≤ 3 tháng: chia theo THÁNG, mỗi tháng chia tiếp theo TUẦN (Tuần 1 → Tuần 4). Mỗi tuần nêu 2–3 hành động cụ thể, có tiêu chí hoàn thành.
- Nếu timeline là 4–12 tháng: chia THEO THÁNG. Mỗi tháng 2–3 hành động cụ thể gắn với ngân sách và KPI.
- Nếu timeline là ≥ 2 năm: BẮT BUỘC có "Năm thứ nhất" và "Năm thứ hai" (nếu 2 năm), mỗi năm chia THEO QUÝ (Q1–Q4). Mỗi quý nêu mục tiêu và 3–5 hành động chính. Không được thiếu năm/quý.
- Nếu là khoảng (ví dụ: 2–3 năm): trình bày đủ tối thiểu 2 năm theo Năm → Quý; phần thời gian còn lại tóm lược có cấu trúc.

## 📅 PHẦN 7: HÀNH ĐỘNG CHI TIẾT THEO THỜI GIAN MỤC TIÊU

Tùy theo timeline người dùng:
- ≤ 3 tháng: liệt kê HÀNH ĐỘNG THEO TUẦN cho toàn bộ số tháng (mỗi tuần 3 hành động rõ ràng, có tiêu chí hoàn thành, ngân sách ước tính).
- 4–12 tháng: liệt kê HÀNH ĐỘNG THEO THÁNG (mỗi tháng 3 hành động).
- ≥ 2 năm: liệt kê HÀNH ĐỘNG THEO QUÝ cho toàn bộ thời gian (mỗi quý 3–5 hành động). Nếu là khoảng 2–3 năm, ưu tiên đủ 2 năm theo quý, phần còn lại tóm lược.
Không chèn câu hướng dẫn meta; chỉ đưa nội dung hành động cụ thể.

## PHẦN 8: TÀI LIỆU HỌC TẬP (8–12 tài liệu)
Ưu tiên nguồn tiếng Việt và miễn phí; đa dạng sách/khóa học/YouTube/blog/công cụ. Mỗi dòng ghi rõ: Mục tiêu học gì → Link → Thời lượng đề xuất.
1. [Tên] – [Link] – [Mục tiêu] – [Thời lượng]
2. [Tên] – [Link] – [Mục tiêu] – [Thời lượng]
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
  "resources": [8-12 links]
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
Phân tích SWOT dước dạng văn bản, không dùng bảng:

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
Lộ trình chi tiết dước dạng văn bản:

**Năm thứ nhất:**
- **Quý 1:**
  - *Tháng thứ nhất:* [Mục tiêu và hành động]
  - *Tháng thứ hai:* [Mục tiêu và hành động]
  - *Tháng thứ ba:* [Mục tiêu và hành động]

**Năm thứ hai:**
- **Quý 1:**
  - *Tháng thứ nhất:* [Mục tiêu và hành động]

## 7. KẾ HOẠCH THỜI GIAN
Kế hoạch thởi gian chi tiết dước dạng văn bản:

**Năm thứ nhất:**
- **Quý 1:** [Mục tiêu chính]
  - *Tháng thứ nhất:* [Hành động cụ thể]
  - *Tháng thứ hai:* [Hành động cụ thể]
  - *Tháng thứ ba:* [Hành động cụ thể]

## PHẦN 7: CHIẾN LƯỢC HÀNH ĐỘNG CHI TIẾT
Viết 600-800 từ chi tiết về chiến lược thực hiện từng mục tiêu cụ thể:

### 🎯 **Chiến lược Mục tiêu 1:** [Tên mục tiêu]
- **Phân tích hiện trạng:** [200 từ]
- **Kế hoạch hành động:** [200 từ]
- **Rủi ro và giải pháp:** [100 từ]

### 🎯 **Chiến lược Mục tiêu 2:** [Tên mục tiêu]
- **Phân tích hiện trạng:** [200 từ]
- **Kế hoạch hành động:** [200 từ]
- **Rủi ro và giải pháp:** [100 từ]

## 9. PHÂN LOẠI ƯU TIÊN
Phân loại ưu tiên dước dạng văn bản:

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
Chúc mừng! Bạn đang sở hữ bản kế hoạch chuyên sâu nhất với:
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

⚠️ QUY TẮC CHỐNG BỊA ĐẶT (BẮT BUỘC):
✅ Tuyệt đối KHÔNG suy đoán thông tin cá nhân khi thiếu dữ liệu.
✅ Nếu thiếu dữ liệu: ghi rõ "Chưa cung cấp" hoặc "Không đủ dữ liệu để tính toán" và nêu danh sách dữ liệu cần bổ sung.
✅ Không tự tạo giả định trừ khi ghi rõ "Giả định" và giải thích vì sao.

⚠️ QUY TẮC HIỂN THỊ BẮT BUỘC:
✅ KHÔNG sử dụng bảng Markdown - nếu cần hiển thị dữ liệu dạng bảng, chuyển sang dạng danh sách văn bản
✅ KHÔNG sử dụng Mermaid hoặc bất kỳ biểu đồ nào - mô tả bằng văn bản thay thế
✅ KHÔNG sử dụng ngày/tháng cụ thể - luôn dùng "tháng thứ nhất", "tháng thứ hai", "quý thứ nhất", "năm thứ nhất", v.v.
✅ KHÔNG sử dụng bất kỳ cú pháp đặc biệt nào có thể gây lỗi hiển thị
✅ MỌI nội dung phải ở dạng văn bản thuần với Markdown cơ bản (tiêu đề, đậm, nghiêng, danh sách)

CHECKLIST HOÀN THIỆN (BẮT BUỘC):
- Có đủ: PHẦN 1, PHẦN 2, PHẦN 3, PHẦN 4, PHẦN 5, PHẦN 6, PHẦN 7, PHẦN 8, PHẦN 9
- Timeline ≥ 2 năm phải có Năm thứ nhất và Năm thứ hai, mỗi năm đủ Q1–Q4
- Phần 5 phải có cả kỹ năng/kinh nghiệm và 3–5 mô hình tăng thu nhập
- Phần 7 liệt kê hành động trọn vẹn cho toàn bộ timeline
- Phần 8 tối thiểu 8 tài liệu
- Có Kết luận rõ ràng

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
- Tuổi: ${collectedInfo.age || 'Chưa cung cấp'}
- Thu nhập: ${collectedInfo.income || collectedInfo.income_range || 'Chưa cung cấp'} VNĐ/tháng
- Tiết kiệm: ${collectedInfo.savings || 'Chưa cung cấp'} VNĐ
- Nơi sống: ${collectedInfo.location || 'Chưa cung cấp'}
- Nghề nghiệp: ${collectedInfo.occupation || 'Chưa cung cấp'}
- Mục tiêu: ${collectedInfo.goal || 'Chưa cung cấp'}
- Timeline: ${collectedInfo.timeline || 'Chưa cung cấp'}
- Thu nhập mục tiêu: ${collectedInfo.target_income || 'Chưa cung cấp'}
- Dự án hiện tại: ${collectedInfo.project || collectedInfo.current_project || 'Chưa cung cấp'}
- Kỹ năng: ${(Array.isArray(collectedInfo.skills) ? collectedInfo.skills.join(', ') : (collectedInfo.skills || 'Chưa cung cấp'))}
- Risk tolerance: ${collectedInfo.risk_tolerance || 'Chưa cung cấp'}

⚠️ LƯU Ý: Phân biệt rõ HIỆN CÓ vs MỤC TIÊU khi phân tích.
`
}
