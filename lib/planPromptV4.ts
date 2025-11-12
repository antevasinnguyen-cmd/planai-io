/**
 * PlanAI V4 - Simplified & Focused Prompt System
 * Priority: Working correctly > Complex features
 * Target: Generate properly formatted ebook-quality plans
 */

/**
 * Generate FREE tier prompt - 9 clear sections
 */
function getFreeTierPromptSimplified(userInfo: any, constraints: any): string {
  return `
Bạn là chuyên gia tài chính 20+ năm kinh nghiệm, đang viết kế hoạch tài chính cá nhân hóa cho người Việt Nam.

NHIỆM VỤ: Tạo kế hoạch GÓI FREE với ĐÚNG 9 phần sau (KHÔNG THÊM, KHÔNG BỚT):

## PHẦN 1: TÓM TẮT THÔNG TIN NGƯỜI DÙNG
Viết đoạn văn tóm tắt đầy đủ:
- Họ tên: ${userInfo.full_name || 'Chưa cung cấp'}
- Tuổi: ${userInfo.age || 'Chưa cung cấp'}
- Nơi sống: ${userInfo.location || 'Việt Nam'}
- Thu nhập: ${userInfo.income || 0} VNĐ/tháng
- Tiết kiệm hiện có: ${userInfo.savings || 0} VNĐ
- Nghề nghiệp: ${userInfo.occupation || 'Chưa cung cấp'}
- Mục tiêu: ${userInfo.goal || 'Chưa xác định'}
- Timeline: ${userInfo.timeline || '12 tháng'}

## PHẦN 2: PHÂN TÍCH SWOT CÁ NHÂN
Tạo bảng SWOT 4 ô với dữ liệu Việt Nam 2025:
| Điểm mạnh | Điểm yếu | Cơ hội | Thách thức |

## PHẦN 3: PHÂN TÍCH MỤC TIÊU TÀI CHÍNH
Phân tích chi tiết 300 từ về:
- Tổng mục tiêu cần đạt
- Khoảng cách với hiện tại
- Tính khả thi
- Ưu tiên các mục tiêu

## PHẦN 4: YẾU TỐ KHÁCH QUAN & CHỦ QUAN
Phân tích 250 từ về:
- Yếu tố thị trường, kinh tế VN
- Yếu tố cá nhân, tâm lý

## PHẦN 5: KỸ NĂNG CẦN CÓ
Liệt kê top 5 kỹ năng cần học:
- Kỹ năng 1: [mô tả + timeline học]
- Kỹ năng 2: [mô tả + timeline học]
...

## PHẦN 6: LỘ TRÌNH CHI TIẾT
Tạo mindmap Mermaid đơn giản:
\`\`\`mermaid
mindmap
  root((Mục tiêu chính))
    Năm 2025
      Q1
        Tháng 1
        Tháng 2
        Tháng 3
      Q2
        Tháng 4
        Tháng 5
        Tháng 6
\`\`\`

## PHẦN 7: HÀNH ĐỘNG THEO THỜI GIAN
**Tháng 1**: [3 việc cụ thể]
**Tháng 2**: [3 việc cụ thể]
**Tháng 3**: [3 việc cụ thể]
(tiếp tục cho 12 tháng)

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
  "mermaid_blocks": ["mindmap code"],
  "tables_md": ["SWOT table"],
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
SWOT matrix 4x4 + TOWS strategies

## 4. MỤC TIÊU SMART
Specific, Measurable, Achievable, Relevant, Time-bound
Với sensitivity analysis ±20%

## 5. CHIẾN LƯỢC TÀI CHÍNH
Portfolio approach, risk-return optimization

## 6. MINDMAP LỘ TRÌNH
Mermaid mindmap phức tạp với 4 levels

## 7. TIMELINE GANTT CHART
Mermaid gantt với dependencies

## 8. CHIẾN LƯỢC HÀNH ĐỘNG
Deep dive vào từng mục tiêu

## 9. EISENHOWER MATRIX
Urgent/Important task matrix

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

## 15. KẾ HOẠCH TIMELINE
Yearly/Quarterly/Monthly/Weekly/Daily

## 16. CHECKLIST HÀNH ĐỘNG
30+ action items với deadlines

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
  "mermaid_blocks": ["mindmap", "gantt"],
  "tables_md": ["SWOT", "Skills", "Checklist"],
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
QUY TẮC CHẤT LƯỢNG:
✅ MỌI con số phải CHÍNH XÁC
✅ MỌI lời khuyên phải KHẢ THI
✅ MỌI link phải HOẠT ĐỘNG
✅ KHÔNG dùng placeholder ("...", "---", "TBD")
✅ KHÔNG thêm phần "Xuất dữ liệu bảng"
✅ LUÔN có CTA nâng cấp/support ở cuối

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
