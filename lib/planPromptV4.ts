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
✅ ĐỘ DÀI: 4.500–5.000 từ cho bản FREE (chi tiết, đầy đủ, KHÔNG được cắt ngắn dù bất kỳ lý do gì)
✅ CÁ NHÂN HÓA: Mỗi phần phải liên kết trực tiếp với thông tin cụ thể của user (nghề nghiệp, kỹ năng, dự án, địa điểm)
✅ CHUYÊN SÂU: Không viết chung chung, phải có ví dụ số liệu cụ thể, case study thực tế từ thị trường Việt Nam

🔍 QUY TẮC VALIDATION 4 LẦN (BẮT BUỘC):
Trước khi viết mỗi phần phân tích số liệu, BẠN PHẢI TỰ KIỂM TRA 4 LẦN:
1️⃣ Lần 1: Đọc lại THÔNG TIN NGƯỜI DÙNG ở trên - thu nhập hiện tại là bao nhiêu? (VD: 7-10 triệu, KHÔNG PHẢI 20 triệu)
2️⃣ Lần 2: Kiểm tra xem mình có đang tự bịa số liệu không? Nếu user nói "7-10 triệu" thì PHẢI dùng "7-10 triệu", KHÔNG được giả định "20 triệu"
3️⃣ Lần 3: Cross-check logic: Nếu thu nhập 7-10 triệu/tháng, mục tiêu 1 tỷ/tháng, thì Gap = 1 tỷ - (7-10 triệu) = 990-993 triệu/tháng cần tăng thêm
4️⃣ Lần 4: Đọc lại câu trả lời của mình - có số nào không khớp với dữ liệu gốc không? Nếu có thì SỬA NGAY

⚠️ CẤM TUYỆT ĐỐI:
❌ KHÔNG được tự bịa số liệu khi đã có dữ liệu thật (VD: user nói "7-10 triệu" mà viết "giả sử 20 triệu")
❌ KHÔNG được bỏ qua dữ liệu user cung cấp
❌ KHÔNG được dùng số liệu mơ hồ khi đã có số cụ thể
❌ MỌI phép tính phải dựa trên SỐ LIỆU THẬT từ thông tin user

## Phần 1. CHÂN DUNG TÀI CHÍNH CÁ NHÂN (600-800 từ)

**Phân tích chuyên sâu về bản thân bạn:**

${personalSummary ? `📋 **Thông tin cá nhân:**\n${personalSummary}` : ''}

${financeSummary ? `\n💰 **Tình hình tài chính:**\n${financeSummary}` : ''}

**🔍 Phân tích điểm mạnh độc đáo của bạn:**
- Dựa trên nghề nghiệp/dự án hiện tại, phân tích chi tiết 3-4 điểm mạnh CỤ THỂ (VD: nếu làm SaaS AI thì phân tích về kỹ năng tech, xu hướng thị trường AI tại VN, khả năng mở rộng...)
- Mỗi điểm mạnh kèm ví dụ số liệu hoặc case study cụ thể từ thị trường Việt Nam
- Liên kết với mục tiêu tài chính: điểm mạnh này giúp đạt mục tiêu như thế nào?

**⚠️ Phân tích thách thức thực tế:**
- Dựa trên thu nhập hiện tại và mục tiêu, tính toán Gap cụ thể
- Phân tích 3-4 thách thức THỰC TẾ với user này (không chung chung)
- Mỗi thách thức đề xuất hướng giải quyết ngắn gọn

> Lưu ý: Tất cả phân tích phải dựa trên dữ liệu thật user cung cấp, không giả định.

## Phần 2. PHÂN TÍCH SWOT - BỨC TRANH TOÀN CẢNH (700-900 từ)

*Phân tích SWOT chuyên sâu và CÁ NHÂN HÓA hoàn toàn dựa trên thông tin của bạn:*

### 💪 **ĐIỂM MẠNH - Vũ khí của bạn (4-5 điểm):**
- Phân tích CỤ THỂ dựa trên: kỹ năng user nêu, kinh nghiệm, dự án hiện tại, địa điểm (VD: ở Bắc Ninh có chi phí sinh hoạt thấp hơn HN/HCM)
- MỖI điểm mạnh phải có:
  + Mô tả cụ thể không chung chung
  + Ví dụ số liệu hoặc case study từ thị trường VN (VD: "Nếu làm SaaS AI, thị trường VN đang thiếu hụt giải pháp AI nội địa, cơ hội tăng trưởng 200-300%/năm")
  + Cách tận dụng điểm mạnh này để đạt mục tiêu tài chính

### ⚠️ **ĐIỂM YẾU - Cần khắc phục (4-5 điểm):**
- Liên quan TRỰC TIẾP đến mục tiêu tài chính user nêu
- MỖI điểm yếu phải có:
  + Phân tích tác động cụ thể (VD: "Vốn ban đầu thấp → không thể thuê marketing agency → phải tự học SEO/content")
  + Cách khắc phục ngắn hạn (1-3 tháng) và dài hạn (6-12 tháng)
  + Ước tính chi phí/thời gian để khắc phục

### 🚀 **CƠ HỘI - Cánh cửa mở ra (4-5 cơ hội):**
- CHỈ nêu cơ hội LIÊN QUAN TRỰC TIẾP tới ngành/dự án/mục tiêu của user
- MỖI cơ hội phải có:
  + Xu hướng thị trường cụ thể tại VN (có số liệu nếu có thể)
  + Cách user có thể tận dụng cơ hội này
  + Timeline và ROI dự kiến (VD: "Nếu làm SaaS AI cho SMEs, thị trường 500K doanh nghiệp, chỉ cần chiếm 0.1% = 500 khách hàng")

### 🌊 **THÁCH THỨC - Rào cản cần vượt qua (4-5 thách thức):**
- Phân tích THỰC TẾ với user này, không chung chung
- Bao gồm:
  + Thách thức kinh tế vĩ mô (lạm phát 4-5%/năm tại VN, lãi suất...)
  + Thách thức ngành cụ thể (cạnh tranh, rào cản gia nhập...)
  + Thách thức cá nhân (dòng tiền, kinh nghiệm, network...)
- MỖI thách thức có đề xuất cách ứng phó

## Phần 3. PHÂN TÍCH MỤC TIÊU - LỘ TRÌNH ĐẾN THÀNH CÔNG

*Chỉ dựa trên dữ liệu bạn đã cung cấp. Không dùng placeholder. Nếu thiếu số dư tiết kiệm hiện có, **giả định 0 VNĐ để ước tính ban đầu** và ghi chú rõ ràng đây là giả định.*

### 📊 **Bức tranh tổng quan:**
Viết 500-600 từ với các mục sau, có số liệu rõ ràng:

**1. Mục tiêu tổng thể:** 
- Liệt kê ĐÚNG các mục tiêu bạn đã nêu, không thêm mục tiêu mới.

**2. Khoảng cách hiện tại (Gap):**
- Nếu có số tiền tiết kiệm hiện có: Gap = Tổng mục tiêu − Tiết kiệm hiện có.
- Nếu chưa có dữ liệu tiết kiệm: ghi chú "Giả định: tiết kiệm hiện có = 0 VNĐ" và tính Gap theo giả định này.

**3. Tính khả thi (VALIDATION 4 LẦN BẮT BUỘC):**

🔍 **BƯỚC KIỂM TRA TRƯỚC KHI TÍNH:**
- Kiểm tra lần 1: Thu nhập hiện tại user cung cấp là bao nhiêu? (Đọc lại phần trên)
- Kiểm tra lần 2: Mình có đang tự bịa số không? Phải dùng ĐÚNG số user nói
- Kiểm tra lần 3: Tính toán logic có đúng không?
- Kiểm tra lần 4: Đọc lại kết quả - có số nào sai so với dữ liệu gốc không?

**Phân tích:**
- Nếu thu nhập là khoảng (ví dụ: 7–10 triệu/tháng) và thời gian là khoảng (ví dụ: 2–3 năm), hãy tính cả kịch bản MIN và MAX:
  - Thu nhập HIỆN TẠI: [GHI RÕ SỐ USER CUNG CẤP, VD: 7-10 triệu/tháng]
  - Quy đổi thởi gian về tháng (ví dụ: 24–36 tháng)
  - Tiền cần/tháng (MIN, MAX) = Gap / số_tháng (MAX, MIN)
  - Tỷ lệ tiết kiệm cần thiết = Tiền cần/tháng / Thu nhập HIỆN TẠI (dùng số thật, không bịa)
  - Nếu mục tiêu thu nhập tương lai được nêu (ví dụ: 1 tỷ/tháng từ SaaS), bổ sung kịch bản có/không đạt mục tiêu này
  - Kết luận: Khả thi / Cần điều chỉnh / Cần tăng thu nhập (nêu lý do)
- Nếu thiếu dữ liệu: ghi rõ "Không đủ dữ liệu để đánh giá khả thi"

✅ **SAU KHI VIẾT XONG, ĐỌC LẠI VÀ TỰ HỎI:** "Mình có dùng đúng số liệu user cung cấp không? Có tự bịa số nào không?"

**4. Thứ tự ưu tiên thông minh:**
- Sắp xếp theo tiêu chí: Impact (tác động) / Cost (chi phí) / Time (thời gian). Không suy đoán nếu thiếu dữ liệu.

## Phần 4. YẾU TỐ KHÁCH QUAN & CHỦ QUAN
Viết 300-400 từ, CHỈ nêu các yếu tố ảnh hưởng TRỰC TIẾP tới mục tiêu đã cung cấp (ví dụ: lãi suất vay khi mục tiêu là mua nhà). Tránh nhận định chung chung. Nếu thiếu dữ liệu về mục tiêu, ghi rõ hạn chế.

## Phần 5. KỸ NĂNG & KINH NGHIỆM CẦN CÓ + MÔ HÌNH KINH DOANH GỢI Ý (600-800 từ)

### 📚 **Kỹ năng/kinh nghiệm cốt lõi cần có (5-6 kỹ năng):**
Dựa trên mục tiêu tài chính và dự án hiện tại của user, phân tích chi tiết:
- MỖI kỹ năng phải có:
  + Lý do tại sao kỹ năng này QUAN TRỌNG cho mục tiêu của user
  + ROI dự kiến cụ thể (VD: "Học SEO → tăng traffic 200% trong 6 tháng → giảm 50% chi phí quảng cáo")
  + Lộ trình học cụ thể: Thời lượng (VD: 2-3 tháng), Nguồn học (tên khóa học/sách cụ thể), Chi phí ước tính
  + Cách áp dụng ngay vào dự án hiện tại của user

### 💼 **3-5 mô hình tăng thu nhập phù hợp:**
Dựa trên kỹ năng, kinh nghiệm, dự án hiện tại của user để gợi ý:
- MỖI mô hình phải có:
  + Mô tả cụ thể (không chung chung)
  + Nguồn lực cần: Vốn ban đầu, Thời gian, Kỹ năng
  + Phân tích rủi ro THỰC TẾ và cách giảm thiểu
  + KPI 90 ngày đầu (số liệu cụ thể: VD "10 khách hàng đầu tiên, doanh thu 30 triệu")
  + Ví dụ giá bán và biên lợi nhuận tại thị trường VN (VD: "SaaS B2B giá 500K-2M/tháng, biên lợi nhuận 70-80%")
  + Case study thực tế từ VN nếu có

## Phần 6. LỘ TRÌNH CHI TIẾT
Linh hoạt theo thởi gian mục tiêu người dùng nêu ra:
- Nếu timeline là ≤ 3 tháng: chia theo THÁNG, mỗi tháng chia tiếp theo TUẦN (Tuần 1 → Tuần 4). Mỗi tuần nêu 2–3 hành động cụ thể, có tiêu chí hoàn thành.
- Nếu timeline là 4–12 tháng: chia THEO THÁNG. Mỗi tháng 2–3 hành động cụ thể gắn với ngân sách và KPI.
- Nếu timeline là ≥ 2 năm: BẮT BUỘC có "Năm thứ nhất" và "Năm thứ hai" (nếu 2 năm), mỗi năm chia THEO QUÝ (Q1–Q4). Mỗi quý nêu mục tiêu và 3–5 hành động chính. Không được thiếu năm/quý.
- Nếu là khoảng (ví dụ: 2–3 năm): trình bày đủ tối thiểu 2 năm theo Năm → Quý; phần thởi gian còn lại tóm lược có cấu trúc.

## Phần 7. HÀNH ĐỘNG CHI TIẾT THEO THỜI GIAN MỤC TIÊU

Tùy theo timeline người dùng:
- ≤ 3 tháng: liệt kê HÀNH ĐỘNG THEO TUẦN cho toàn bộ số tháng (mỗi tuần 3 hành động rõ ràng, có tiêu chí hoàn thành, ngân sách ước tính).
- 4–12 tháng: liệt kê HÀNH ĐỘNG THEO THÁNG (mỗi tháng 3 hành động).
- ≥ 2 năm: liệt kê HÀNH ĐỘNG THEO QUÝ cho toàn bộ thởi gian (mỗi quý 3–5 hành động). Nếu là khoảng 2–3 năm, ưu tiên đủ 2 năm theo quý, phần còn lại tóm lược.
Không chèn câu hướng dẫn meta; chỉ đưa nội dung hành động cụ thể.

## Phần 8. TÀI LIỆU HỌC TẬP KỸ NĂNG (30+ tài liệu chi tiết)

**YÊU CẦU BẮT BUỘC: Tối thiểu 30 tài liệu, bao gồm 10+ video YouTube với từ khóa tìm kiếm chính xác**

Phân loại theo nhóm kỹ năng liên quan đến mục tiêu của user:

### 💰 **Nhóm 1: Kỹ năng tài chính cốt lõi (8-10 tài liệu):**
**Sách & Khóa học (4-5 tài liệu):**
1. **[Tên sách/khóa học]**
   - Link: [URL cụ thể]
   - Mục tiêu: Học gì từ tài liệu này (cụ thể, không chung chung)
   - Thời lượng: [X giờ/tuần trong Y tuần]
   - Lý do chọn: Tại sao tài liệu này phù hợp với user
   - Cách áp dụng: Áp dụng vào dự án/mục tiêu như thế nào

**Video YouTube (4-5 video với từ khóa tìm kiếm):**
1. **[Tiêu đề video cụ thể]**
   - Từ khóa tìm kiếm: "[Từ khóa chính xác để tìm trên YouTube]"
   - Kênh gợi ý: [Tên kênh YouTube phù hợp]
   - Nội dung: [Tóm tắt nội dung video]
   - Thời lượng: [X phút]
   - Cách áp dụng: [Áp dụng kiến thức vào mục tiêu như thế nào]

Ví dụ từ khóa tìm kiếm YouTube:
- "Quản lý tài chính cá nhân cho người mới bắt đầu"
- "Cách lập ngân sách chi tiêu hiệu quả"
- "Đầu tư chứng khoán cơ bản cho người Việt"
- "Passive income ideas 2024"
- "Financial freedom roadmap"

### 🚀 **Nhóm 2: Kỹ năng chuyên môn theo ngành (12-15 tài liệu):**
(Dựa trên nghề nghiệp/dự án của user: VD nếu làm SaaS thì gợi ý về product development, marketing SaaS, pricing...)

**Sách & Khóa học (6-8 tài liệu):**
- Ưu tiên nguồn tiếng Việt và MIỄN PHÍ
- Đa dạng: Sách, Khóa học, Blog, Công cụ
- Mỗi tài liệu có đầy đủ: Tên, Link, Mục tiêu, Thời lượng, Lý do chọn, Cách áp dụng

**Video YouTube (6-7 video với từ khóa tìm kiếm):**
Dựa trên ngành nghề của user, gợi ý từ khóa tìm kiếm cụ thể. Ví dụ:
- Nếu làm SaaS: "SaaS marketing strategies", "Product-led growth tutorial", "SaaS pricing models"
- Nếu làm E-commerce: "Shopify dropshipping guide", "Facebook ads for ecommerce", "Product sourcing tips"
- Nếu làm Content Creator: "YouTube SEO tutorial", "Content monetization strategies", "Video editing tips"
- Nếu làm Freelancer: "Freelance pricing strategies", "Client acquisition tips", "Portfolio building guide"

### 🎯 **Nhóm 3: Kỹ năng mềm & tư duy (10-12 tài liệu):**
(Marketing, Sales, Leadership, Productivity... phù hợp với mục tiêu tài chính)

**Sách & Khóa học (5-6 tài liệu):**
- Format tương tự như trên
- Liên kết rõ ràng với mục tiêu tăng thu nhập

**Video YouTube (5-6 video với từ khóa tìm kiếm):**
Ví dụ từ khóa:
- "Time management techniques for entrepreneurs"
- "Sales psychology and persuasion"
- "Personal branding on LinkedIn"
- "Productivity hacks for busy professionals"
- "Negotiation skills for salary increase"
- "Networking strategies for career growth"

**QUAN TRỌNG - Hướng dẫn tìm video YouTube:**
- Với mỗi video, cung cấp **từ khóa tìm kiếm chính xác** để user tự tìm trên YouTube
- Gợi ý **tên kênh YouTube uy tín** trong lĩnh vực đó (VD: Ali Abdaal, Thomas Frank, Gary Vee, Spiderum, Toidicodedao...)
- Mô tả **nội dung chính** của video và **cách áp dụng** vào mục tiêu của user
- Ưu tiên video **tiếng Việt có phụ đề** hoặc **tiếng Anh có phụ đề Việt**

**Lưu ý:** Mỗi tài liệu phải là GỢI Ý CỤ THỂ, có link thật hoặc từ khóa tìm kiếm chính xác. KHÔNG viết chung chung kiểu "Tìm khóa học về..."

## Phần 9. KẾT LUẬN & HÀNH ĐỘNG NGAY (400-500 từ)

### 📋 **Tóm tắt 3 điểm chính:**
1. **Điểm mạnh lớn nhất:** [Dựa trên phân tích SWOT, nêu cụ thể điểm mạnh user có thể tận dụng ngay]
2. **Thách thức lớn nhất:** [Rào cản chính cần vượt qua + cách khắc phục]
3. **Cơ hội vàng:** [Cơ hội thị trường/ngành cần nắm bắt ngay]

### ⚡ **3 việc làm NGAY trong 24 giờ tới:**
1. **[Hành động cụ thể 1]**
   - Làm gì: [Chi tiết cụ thể, không chung chung]
   - Tại sao: [Lý do hành động này quan trọng]
   - Kết quả mong đợi: [Output cụ thể sau 24h]

2. **[Hành động cụ thể 2]**
   - Làm gì, Tại sao, Kết quả mong đợi (tương tự)

3. **[Hành động cụ thể 3]**
   - Làm gì, Tại sao, Kết quả mong đợi (tương tự)

### 💪 **Lời động viên cá nhân:**
Viết 3-4 câu động viên CÁ NHÂN HÓA dựa trên:
- Tình huống cụ thể của user (nghề nghiệp, mục tiêu, thách thức)
- Điểm mạnh user đã có
- Niềm tin vào khả năng đạt mục tiêu
- Khích lệ hành động ngay, không trì hoãn

**🎯 NÂNG CẤP GÓI TRẢ PHÍ NGAY!**
Bản kế hoạch FREE này chỉ là khởi đầu. Với gói Premium, bạn sẽ nhận được:
✅ 24 phần phân tích chuyên sâu (gấp 3 lần)
✅ Phân tích tử vi tài chính & thần số học chuyên sâu
✅ 3-5 mô hình kinh doanh cá nhân hóa
✅ 70+ tài liệu học tập premium (sách, khóa học, video)
✅ Kế hoạch Ngày/Tuần/Tháng/Quý/Năm chi tiết
✅ Dự báo 3 kịch bản & chiến lược rủi ro toàn diện
✅ Hệ thống thói quen & mindset thành công
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

## Phần 1. TIÊU ĐỀ SÁNG TẠO
Tạo tiêu đề hấp dẫn, cá nhân hóa

## Phần 2. HỒ SƠ TÀI CHÍNH CÁ NHÂN
Executive summary + Hồ sơ chi tiết:
- Họ tên: ${userInfo.full_name}
- Ngày sinh: ${userInfo.birth_date}
- Vị trí: ${userInfo.location}
- Thu nhập: ${userInfo.income}
- Tiết kiệm: ${userInfo.savings}
- Mục tiêu: ${userInfo.goal}

## Phần 3. PHÂN TÍCH SWOT NÂNG CAO
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

## Phần 4. MỤC TIÊU SMART
Specific, Measurable, Achievable, Relevant, Time-bound
Với sensitivity analysis ±20%

## Phần 5. CHIẾN LƯỢC TÀI CHÍNH
Portfolio approach, risk-return optimization

## Phần 6. LỘ TRÌNH CHI TIẾT
Lộ trình chi tiết dước dạng văn bản:

**Năm thứ nhất:**
- **Quý 1:**
  - *Tháng thứ nhất:* [Mục tiêu và hành động]
  - *Tháng thứ hai:* [Mục tiêu và hành động]
  - *Tháng thứ ba:* [Mục tiêu và hành động]

**Năm thứ hai:**
- **Quý 1:**
  - *Tháng thứ nhất:* [Mục tiêu và hành động]

## Phần 7. KẾ HOẠCH THỜI GIAN
Kế hoạch thởi gian chi tiết dước dạng văn bản:

**Năm thứ nhất:**
- **Quý 1:** [Mục tiêu chính]
  - *Tháng thứ nhất:* [Hành động cụ thể]
  - *Tháng thứ hai:* [Hành động cụ thể]
  - *Tháng thứ ba:* [Hành động cụ thể]

## Phần 8. CHIẾN LƯỢC HÀNH ĐỘNG CHI TIẾT
Viết 600-800 từ chi tiết về chiến lược thực hiện từng mục tiêu cụ thể:

### 🎯 **Chiến lược Mục tiêu 1:** [Tên mục tiêu]
- **Phân tích hiện trạng:** [200 từ]
- **Kế hoạch hành động:** [200 từ]
- **Rủi ro và giải pháp:** [100 từ]

### 🎯 **Chiến lược Mục tiêu 2:** [Tên mục tiêu]
- **Phân tích hiện trạng:** [200 từ]
- **Kế hoạch hành động:** [200 từ]
- **Rủi ro và giải pháp:** [100 từ]

## Phần 9. KỸ NĂNG & KINH NGHIỆM CẦN CÓ
Trình bày DƯỚI DẠNG BẢNG MARKDOWN:

| STT | Kỹ năng | Mức độ quan trọng | Thời gian học | ROI dự kiến |
| --- | -------- | ----------------- | ------------- | ----------- |
| 1 | [Tên kỹ năng] | Cao/Trung bình | [X tuần] | [Lợi ích cụ thể] |

QUY TẮc:
- Liệt kê 5-8 kỹ năng cần thiết
- KHÔNG dùng "---" hoặc "- - -" để lấp chỗ trống
- Chỉ thêm dòng khi có nội dung cụ thể

## Phần 10. PHÂN LOẠI ƯU TIÊN
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

## Phần 11. YẾU TỐ THÀNH CÔNG
Hard factors + Soft factors

## Phần 12. TÍCH LŨY TÀI SẢN
Asset accumulation strategy

## Phần 13. ĐẦU TƯ & RỦI RO
Trình bày DƯỚI DẠNG BẢNG MARKDOWN:

| Loại | Kênh/Rủi ro | Tỷ lệ | Mức độ rủi ro | Ghi chú |
| ---- | ----------- | ------ | ------------- | ------- |
| Đầu tư | [Kênh 1] | [X%] | Thấp/TB/Cao | [Chi tiết] |
| Rủi ro | [Rủi ro 1] | - | Cao | [Cách giảm thiểu] |

QUY TẮc BẮT BUỘC:
- KHÔNG được viết "Tóm tắt tình hình tài chính của bạn"
- KHÔNG dùng "---" hoặc "- - -" để lấp chỗ trống
- Liệt kê 3-5 kênh đầu tư + 3-5 rủi ro chính

## Phần 14. MÔ HÌNH KINH DOANH
Trình bày 3-5 mô hình kinh doanh cá nhân hóa DƯỚI DẠNG BẢNG MARKDOWN:

| STT | Tên mô hình | Vốn cần | Tiềm năng thu nhập | Ghi chú chi tiết |
| --- | ----------- | -------- | ------------------- | ----------------- |
| 1 | [Tên] | [Số tiền] | [Số tiền/tháng] | [Chi tiết triển khai] |

QUY TẮc BẮT BUỘC:
- KHÔNG có cột "Trạng thái" hoặc "Ngày/tháng"
- KHÔNG dùng "---", "- - -", "—" để lấp chỗ trống
- KHÔNG sinh dòng với nội dung "Chưa xác định" hoặc "N/A"
- Chỉ tạo dòng khi có nội dung CỤ THỂ

## Phần 15. XU HƯỚNG THỊ TRƯỜNG & TIỀM NĂNG KINH DOANH

Mục tiêu phần này: Cập nhật bức tranh thị trường và chỉ ra các cơ hội kinh doanh có thể khai thác, bám sát nghề/ngành của user. Trình bày súc tích, định hướng hành động, KHÔNG nêu mốc năm cụ thể (chỉ dùng các cụm “trong thời gian tới”, “ngắn hạn”, “trung hạn”, “dài hạn”).

### 1) Bức tranh vĩ mô (Việt Nam & quốc tế):
- Xu hướng tiêu dùng, công nghệ, chính sách tác động đến ngành của user
- Cơ hội từ chuyển dịch hành vi: online hóa, AI, mobile-first, subscription...

### 2) Xu hướng theo ngành/ngách (cá nhân hóa theo occupation):
- 3–5 xu hướng nổi bật, kèm ví dụ thực tế tại VN/khu vực
- Rào cản gia nhập & lợi thế cạnh tranh có thể tận dụng

### 3) Cơ hội mô hình kinh doanh & unit economics rút gọn:
- 3–5 cơ hội khả thi (đối tượng khách, đề xuất giá trị, kênh phân phối)
- Unit economics: Doanh thu/đơn vị, chi phí chính, biên lợi nhuận mục tiêu

### 4) Rủi ro thị trường & phương án giảm thiểu:
- 3 rủi ro chính (quy định, cạnh tranh, xu hướng thay đổi)
- Cách giảm thiểu: pilot nhỏ, A/B giá, đa kênh, hợp tác

### 5) Next steps có thể làm ngay (không nêu mốc năm):
- 3 bước thăm dò thị trường: customer interviews, landing page, MVP
- 3 bước thử nghiệm kênh: content, ads ngân sách nhỏ, partnership

Giọng văn súc tích, thực tế, định hướng hành động rõ ràng.

## Phần 16. DANH SÁCH HÀNH ĐỘNG
**Hành động 1:** [Mô tả] - Hoàn thành trong tháng thứ nhất
**Hành động 2:** [Mô tả] - Hoàn thành trong tháng thứ hai
**Hành động 3:** [Mô tả] - Hoàn thành trong tháng thứ ba
(và các hành động khác...)

## Phần 17. TÀI LIỆU HỌC TẬP BỔ SUNG
${tier === 'basic' ? '30+' : tier === 'pro' ? '50+' : '70+'} resources (bao gồm sách, khóa học, video YouTube)

## Phần 19. DỰ BÁO 3 KỊCH BẢN
Worst case / Base case / Best case

## Phần 20. GIẢM THIỂU RỦI RO
Diversification + Insurance + Legal

## Phần 21. LỜI KHUYÊN SỰ NGHIỆP & TÀI CHÍNH

Mục tiêu phần này: Cung cấp lời khuyên thực tế, động lực và các quote truyền cảm hứng để user duy trì động lực thực hiện kế hoạch.

### 1. Những Quote Truyền Động Lực Về Sự Nghiệp

**Về khởi đầu và hành động:**
- "Hành động nhỏ hôm nay sẽ tạo nên sự khác biệt lớn ngày mai. Bắt đầu từ bây giờ, không phải ngày mai." - James Clear
- "Thành công không phải là điểm đích, mà là hành trình. Mỗi bước tiến là một chiến thắng." - Tony Robbins
- "Những người thành công không bao giờ bỏ cuộc. Họ chỉ đơn giản là không dừng lại." - Zig Ziglar

**Về vượt qua thách thức:**
- "Thất bại là bước đệm để thành công. Mỗi lần ngã, bạn học được cách đứng dậy mạnh mẽ hơn." - Oprah Winfrey
- "Khó khăn là cơ hội để chứng minh giá trị của bạn. Đừng sợ thách thức, hãy chào đón nó." - Steve Jobs
- "Bạn không thể thay đổi quá khứ, nhưng bạn có thể tạo ra tương lai mà bạn muốn." - Unknown

**Về tài chính và đầu tư:**
- "Tiền không phải là mục tiêu, mà là công cụ để xây dựng cuộc sống tự do. Quản lý nó thông minh." - Robert Kiyosaki
- "Đầu tư vào bản thân là khoản đầu tư tốt nhất. Kỹ năng và kiến thức không bao giờ bị mất." - Warren Buffett
- "Giàu có không phải về kiếm được nhiều tiền, mà về chi tiêu ít hơn những gì bạn kiếm được." - David Ramsey

**Về kiên trì và tập trung:**
- "Thành công là kết quả của chuỗi quyết định nhỏ hàng ngày. Hãy tập trung vào những gì bạn có thể kiểm soát." - James Clear
- "Đừng so sánh tiến độ của bạn với người khác. Hãy so sánh bạn hôm nay với bạn hôm qua." - Unknown
- "Nếu bạn không có kế hoạch, bạn sẽ trở thành một phần của kế hoạch của người khác." - Unknown

### 2. Lời Khuyên Thực Tế Về Sự Nghiệp

**Xây dựng nền tảng vững chắc:**
- Hãy chuyên tâm vào 1-2 kỹ năng chính trước khi mở rộng. Sâu hơn là tốt hơn rộng.
- Tìm một người cố vấn hoặc mentor trong lĩnh vực bạn muốn phát triển. Kinh nghiệm của họ sẽ giúp bạn tránh được nhiều sai lầm.
- Xây dựng mạng lưới chuyên nghiệp từ sớm. Những mối quan hệ tốt sẽ mở ra nhiều cơ hội.

**Tăng giá trị cá nhân:**
- Liên tục học hỏi và cập nhật kiến thức. Thế giới thay đổi nhanh, bạn cần theo kịp.
- Xây dựng danh tiếng tốt trong ngành. Uy tín là tài sản quý giá nhất.
- Hãy sẵn sàng nhận lấy trách nhiệm và chủ động giải quyết vấn đề. Đó là cách bạn nổi bật.

**Quản lý sự nghiệp chiến lược:**
- Đặt mục tiêu rõ ràng cho mỗi năm, mỗi quý. Không có mục tiêu, không có hướng đi.
- Định kỳ đánh giá tiến độ và điều chỉnh kế hoạch. Linh hoạt là chìa khóa thành công.
- Đừng chỉ chạy theo tiền. Chọn công việc mà bạn yêu thích, tiền sẽ theo sau.

### 3. Lời Khuyên Thực Tế Về Tài Chính

**Quản lý tiền bạc thông minh:**
- Lập ngân sách chi tiết và tuân thủ nó. Bạn không thể quản lý những gì bạn không theo dõi.
- Tạo quỹ khẩn cấp (3-6 tháng chi phí sống). Đây là lưới an toàn của bạn.
- Theo quy tắc 50/30/20: 50% nhu cầu, 30% muốn, 20% tiết kiệm/đầu tư.

**Đầu tư và tăng trưởng tài sản:**
- Bắt đầu đầu tư sớm, ngay cả với số tiền nhỏ. Lợi suất kép là phép màu của thời gian.
- Đa dạng hóa danh mục đầu tư. Đừng bỏ tất cả trứng vào một giỏ.
- Hiểu rõ những gì bạn đầu tư vào. Đừng đầu tư vào thứ bạn không hiểu.

**Tránh những sai lầm phổ biến:**
- Đừng vay tiền để tiêu xài. Nợ là kẻ thù của tự do tài chính.
- Đừng theo đuổi "làm giàu nhanh". Hầu hết các cách như vậy đều là bẫy.
- Đừng bỏ bê bảo hiểm. Một sự cố có thể phá hủy toàn bộ kế hoạch tài chính.

### 4. Hành Động Cụ Thể Cho Tuần Này

**Hôm nay:**
- Đọc lại phần mục tiêu của kế hoạch này. Hãy để nó trở thành động lực của bạn.
- Viết ra 3 lý do tại sao bạn muốn đạt được mục tiêu này. Hãy để chúng ở nơi bạn có thể nhìn thấy mỗi ngày.

**Tuần này:**
- Thực hiện hành động đầu tiên trong kế hoạch. Đừng chờ đợi điều kiện hoàn hảo.
- Liên hệ với 1 người có thể giúp bạn hoặc cung cấp lời khuyên.
- Xem lại ngân sách và kế hoạch tài chính của bạn. Chuẩn bị cho những thay đổi sắp tới.

**Tháng này:**
- Hoàn thành 3 hành động chính trong kế hoạch.
- Đánh giá tiến độ và điều chỉnh nếu cần.
- Chia sẻ mục tiêu của bạn với ít nhất 1 người tin tưởng. Sự hỗ trợ từ người khác rất quan trọng.

### 5. Tư Duy Thành Công

**Hãy nhớ:**
- Bạn đã có kế hoạch chi tiết. Bây giờ hãy thực hiện nó.
- Mỗi ngày bạn không hành động là một ngày bạn lỡ mất cơ hội.
- Thành công không phải là may mắn, mà là kết quả của hành động liên tục.
- Bạn xứng đáng với thành công. Hãy tin vào bản thân.

**Khi bạn cảm thấy mệt mỏi:**
- Hãy nhớ lại lý do bạn bắt đầu. Đó là động lực mạnh nhất.
- Hãy nhìn lại những tiến bộ bạn đã đạt được. Mỗi bước nhỏ đều quan trọng.
- Hãy tìm kiếm sự hỗ trợ từ bạn bè, gia đình hoặc một cộng đồng cùng chí hướng.
- Hãy nhớ rằng thất bại là một phần của quá trình. Những người thành công đều từng thất bại.

## Phần 22. TÓM TẮT TOÀN BỘ
10 key points summary

## Phần 23. HƯỚNG DẪN SỬ DỤNG
Cách dùng kế hoạch hiệu quả

## Phần 24. KẾT LUẬN & ĐỘNG LỰC
Lời khuyên cuối + First action in 24h

**🚀 BẠN ĐÃ LÀ THÀNH VIÊN ${tier.toUpperCase()}!**
Chúc mừng! Bạn đang sở hữu bản kế hoạch chuyên sâu nhất với:
✅ 24 phần phân tích chi tiết
✅ Phân tích tử vi & thần số học chuyên sâu
✅ 70+ tài liệu học tập premium (sách, khóa học, video)
✅ Hệ thống thói quen & mindset thành công
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
✅ KHÔNG sử dụng bảng Markdown ở CÁC PHẦN KHÁC, NGOẠI TRỪ: Phần 9 (Kỹ năng), Phần 13 (Đầu tư & Rủi ro), Phần 14 (Mô hình kinh doanh)
✅ CHỈ sử dụng Mermaid diagram cho Phần 5 (Lộ trình) - dùng sequenceDiagram để vẽ flow lộ trình. KHÔNG dùng Mermaid ở các phần khác
✅ KHÔNG sử dụng ngày/tháng cụ thể - luôn dùng "tháng thứ nhất", "tháng thứ hai", "quý thứ nhất", "năm thứ nhất", v.v.
✅ KHÔNG sử dụng bất kỳ cú pháp đặc biệt nào có thể gây lỗi hiển thị
✅ MỌI nội dung phải ở dạng văn bản thuần với Markdown cơ bản (tiêu đề, đậm, nghiêng, danh sách)
✅ KHÔNG viết "Tổng quan kế hoạch & Hồ sơ cá nhân" - đây là tiêu đề cũ, không sử dụng
✅ KHÔNG viết "Tóm tắt tình hình tài chính của bạn" trong Phần 13 hoặc bất kỳ phần nào khác
✅ KHÔNG sử dụng ký tự "---", "- - -", "—" hoặc ký hiệu tương tự để lấp chỗ trống
✅ Đánh số các mục lớn bằng "Phần 1", "Phần 2", "Phần 3"... (KHÔNG dùng số La Mã)

CHECKLIST HOÀN THIỆN (BẮT BUỘC):
- Có đủ: Phần 1, Phần 2, Phần 3, Phần 4, Phần 5, Phần 6, Phần 7, Phần 8, Phần 9
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
  // Format income clearly
  const currentIncome = collectedInfo.income || collectedInfo.income_range || 'Chưa cung cấp'
  const targetIncome = collectedInfo.target_income || 'Chưa cung cấp'
  
  return `
📋 THÔNG TIN NGƯỜI DÙNG:

💰 **TÀI CHÍNH HIỆN TẠI (QUAN TRỌNG - ĐỌC KỞ):**
- Thu nhập HIỆN TẠI: ${currentIncome}${currentIncome !== 'Chưa cung cấp' ? ' VNĐ/tháng' : ''}
- Tiết kiệm hiện có: ${collectedInfo.savings || 'Chưa cung cấp'}${collectedInfo.savings ? ' VNĐ' : ''}

🎯 **MỤC TIÊU (KHÁC VỚI HIỆN TẠI):**
- Mục tiêu tài chính: ${collectedInfo.goal || 'Chưa cung cấp'}
- Thu nhập MỤC TIÊU: ${targetIncome}${targetIncome !== 'Chưa cung cấp' ? ' VNĐ/tháng' : ''}
- Thời gian thực hiện: ${collectedInfo.timeline || 'Chưa cung cấp'}

👤 **THÔNG TIN CÁ NHÂN:**
- Họ tên: ${collectedInfo.full_name || 'Chưa cung cấp'}
- Giới tính: ${collectedInfo.gender || 'Chưa cung cấp'}
- Ngày tháng năm sinh: ${collectedInfo.birth_date || 'Chưa cung cấp'}
- Giờ sinh: ${collectedInfo.birth_time || 'Chưa cung cấp'}
- Nơi sống: ${collectedInfo.location || 'Chưa cung cấp'}
- Nghề nghiệp: ${collectedInfo.occupation || 'Chưa cung cấp'}
- Dự án hiện tại: ${collectedInfo.project || collectedInfo.current_project || 'Chưa cung cấp'}
- Kỹ năng: ${(Array.isArray(collectedInfo.skills) ? collectedInfo.skills.join(', ') : (collectedInfo.skills || 'Chưa cung cấp'))}
- Risk tolerance: ${collectedInfo.risk_tolerance || 'Chưa cung cấp'}

🔮 **THÔNG TIN TỬ VI (Dùng cho phân tích Phần XXI):**
- Họ tên đầy đủ: ${collectedInfo.full_name || 'Chưa cung cấp'}
- Giới tính: ${collectedInfo.gender || 'Chưa cung cấp'}
- Ngày tháng năm sinh: ${collectedInfo.birth_date || 'Chưa cung cấp'}
- Giờ sinh: ${collectedInfo.birth_time || 'Chưa cung cấp'}
- Khu vực sinh sống: ${collectedInfo.location || 'Chưa cung cấp'}
⚠️ Nếu đủ 5 thông tin trên, thực hiện luận giải TỬ VI & THẦN SỐ HỌC chi tiết tại Phần XXI.

⚠️ LƯU Ý QUAN TRỌNG:
1. Thu nhập HIỆN TẠI ≠ Thu nhập MỤC TIÊU
2. KHÔNG được tự bịa số liệu khi đã có dữ liệu thật
3. MỌI phép tính phải dùng số liệu ở trên, không được thay đổi
4. Nếu user nói "7-10 triệu" thì PHẢI dùng "7-10 triệu", KHÔNG giả định "20 triệu"
`
}
