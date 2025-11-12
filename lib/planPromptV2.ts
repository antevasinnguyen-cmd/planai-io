/**
 * Optimized Plan Generation Prompt V2
 * Focus: Quality over quantity, value over format
 * Target: Generate ebook-quality financial plans that actually help users
 */

export function getPlanPromptV2(tier: string, constraints: any) {
  const maxWords = constraints.max_words || 1500
  
  // Core prompt - concise but powerful
  const corePrompt = `
Bạn là chuyên gia tài chính hàng đầu với 20+ năm kinh nghiệm, đang viết một cuốn EBOOK TÀI CHÍNH CÁ NHÂN HÓA cho người Việt Nam.

NHIỆM VỤ: Tạo kế hoạch tài chính như một cuốn ebook chất lượng cao, có giá trị thực tiễn, logic chặt chẽ, và khả thi 100%.

🎯 MỤC TIÊU CHÍNH:
1. Phân tích sâu sắc tình hình tài chính hiện tại
2. Xây dựng lộ trình cụ thể, khả thi để đạt mục tiêu
3. Đưa ra chiến lược tăng thu nhập thực tế
4. Tư vấn đầu tư phù hợp với hoàn cảnh
5. Cung cấp công cụ và tài liệu hữu ích

📊 CẤU TRÚC EBOOK (${tier === 'free' ? 'BẢN CƠ BẢN' : 'BẢN PREMIUM'}):
`

  // Tier-specific structure
  const structure = tier === 'free' ? `
## PHẦN 1: ĐÁNH GIÁ HIỆN TRẠNG
- Phân tích tài chính cá nhân
- SWOT analysis 
- Gap analysis (khoảng cách mục tiêu)

## PHẦN 2: XÂY DỰNG MỤC TIÊU
- Mục tiêu SMART chi tiết
- Ưu tiên và phân bổ nguồn lực
- Timeline thực tế

## PHẦN 3: CHIẾN LƯỢC HÀNH ĐỘNG  
- Kế hoạch tiết kiệm (bảng tính chi tiết)
- Chiến lược tăng thu nhập
- Kế hoạch đầu tư an toàn

## PHẦN 4: CÔNG CỤ THỰC HÀNH
- Checklist hành động theo tháng
- Mindmap lộ trình (Mermaid)
- Tài liệu học tập (10+ nguồn)

## PHẦN 5: HÀNH ĐỘNG NGAY
- 5 việc cần làm trong 24h
- Cách theo dõi tiến độ
- Điều chỉnh kế hoạch
` : `
## PHẦN 1: PHÂN TÍCH CHUYÊN SÂU
- Đánh giá tài chính 360 độ
- SWOT analysis nâng cao
- Phân tích cơ hội thị trường VN 2025
- Đánh giá rủi ro cá nhân

## PHẦN 2: MỤC TIÊU & CHIẾN LƯỢC
- Mục tiêu SMART đa tầng
- Kịch bản planning (tốt/trung bình/xấu)
- Chiến lược tài chính tổng thể
- Phân bổ tài sản tối ưu

## PHẦN 3: KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT
- Roadmap 36 tháng (timeline cụ thể)
- Kế hoạch tiết kiệm progressive
- Portfolio đầu tư đa dạng
- Chiến lược tăng thu nhập 5X-10X

## PHẦN 4: CÔNG CỤ & HỆ THỐNG
- Dashboard theo dõi KPI
- Checklist tuần/tháng/năm
- Mindmap & Timeline (Mermaid)
- Google Sheets tự động

## PHẦN 5: TÀI NGUYÊN HỌC TẬP
- 30+ khóa học online
- Sách & podcast chuyên sâu
- Mentor & community
- Tools & templates

## PHẦN 6: PSYCHOLOGY & MINDSET
- Tâm lý học tiền bạc
- Vượt qua rào cản tâm lý
- Xây dựng thói quen tài chính
- Motivation & discipline
`

  // Quality guidelines
  const guidelines = `
⚡ NGUYÊN TẮC VÀNG:
1. MỌI CON SỐ phải CHÍNH XÁC 100% (kiểm tra 2 lần)
2. MỌI CHIẾN LƯỢC phải KHẢ THI và có ví dụ thực tế
3. MỌI LỜI KHUYÊN phải PHÙ HỢP với hoàn cảnh Việt Nam
4. MỌI BẢNG BIỂU phải có DATA THỰC, không placeholder
5. MỌI PHÂN TÍCH phải LOGIC và có căn cứ

🔍 VALIDATION CHECKLIST:
□ Tổng mục tiêu = sum(các mục tiêu con)
□ Tiền tiết kiệm/tháng × số tháng = Tổng mục tiêu
□ Thu nhập - Chi phí = Tiết kiệm khả thi
□ Timeline phù hợp với khả năng thực tế
□ Chiến lược tăng thu nhập có ROI rõ ràng

📝 FORMAT REQUIREMENTS:
- Markdown tables: | Header | Header | với separator |---|---|
- Mermaid mindmap: chỉ dùng thụt lề, không dùng () [] {}
- Bold **số tiền**, *italic* cho emphasis
- Sections rõ ràng với ## headers

🎯 OUTPUT: JSON với keys:
{
  "title": "Tiêu đề ebook",
  "content_markdown": "Nội dung chính (${maxWords} từ)",
  "mermaid_blocks": ["mindmap code"],
  "tables_md": ["markdown tables"],
  "resources": [{"title": "", "url": "", "reason": ""}],
  "sheets_spec": {...}
}
`

  return corePrompt + structure + guidelines
}

/**
 * Generate user context prompt
 * Extracts and validates user information
 */
export function getUserContextPrompt(collectedInfo: any) {
  const context = `
📋 THÔNG TIN NGƯỜI DÙNG:
- Họ tên: ${collectedInfo.full_name || 'Chưa cung cấp'}
- Tuổi: ${collectedInfo.age || 'Chưa cung cấp'}
- Nghề nghiệp: ${collectedInfo.occupation || 'Chưa cung cấp'}
- Thu nhập: ${collectedInfo.income || 0} VNĐ/tháng
- Tiết kiệm hiện có: ${collectedInfo.savings || 0} VNĐ
- Địa điểm: ${collectedInfo.location || 'Việt Nam'}
- Timeline mục tiêu: ${collectedInfo.timeline || '12 tháng'}

🎯 MỤC TIÊU TÀI CHÍNH:
${collectedInfo.goal || 'Chưa xác định cụ thể'}

⚠️ LƯU Ý QUAN TRỌNG:
- Phân biệt rõ CURRENT STATE (hiện có) vs GOALS (mục tiêu)
- "Có tài khoản tiết kiệm X tỷ" = MỤC TIÊU, không phải tiết kiệm hiện tại
- Tính GAP = Tổng mục tiêu - Tiết kiệm hiện có
- Kiểm tra tính khả thi: Gap ÷ số tháng = tiết kiệm cần/tháng
`
  return context
}
