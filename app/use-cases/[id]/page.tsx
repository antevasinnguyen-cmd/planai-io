'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, TrendingUp, Target, Users, Briefcase, GraduationCap, Heart, Lock as LockIcon } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const useCaseDetails = {
  'young-professional': {
    title: 'Người đi làm 25-30 tuổi',
    subtitle: 'Bắt đầu xây dựng tài chính cá nhân',
    icon: Briefcase,
    color: 'from-blue-500 to-blue-600',
    profile: {
      name: 'Nguyễn Minh Tuấn',
      age: 27,
      job: 'Nhân viên Marketing',
      income: '18 triệu/tháng',
      location: 'TP.HCM'
    },
    situation: 'Nam, 27 tuổi, Marketing 18 triệu/tháng tại TP.HCM. Chưa có tiết kiệm, chi tiêu hết thu nhập; cần lộ trình kiểm soát chi tiêu và tăng thu nhập.',
    swot: {
      strengths: ['3 năm kinh nghiệm Marketing', 'Thu nhập ổn định 18 triệu/tháng', 'Vị trí TP.HCM - nhiều cơ hội', 'Tuổi trẻ - thời gian đầu tư dài hạn', 'Thành thạo công nghệ'],
      weaknesses: ['Chưa có thói quen tiết kiệm', 'Thiếu kiến thức tài chính', 'Chi tiêu impulse cao', 'Chưa có quỹ khẩn cấp'],
      opportunities: ['Freelance marketing', 'Thăng tiến trong công ty', 'Đầu tư ETF/cổ phiếu', 'Học thêm kỹ năng digital'],
      threats: ['Lạm phát', 'Áp lực lifestyle', 'Cạnh tranh nghề nghiệp', 'Rủi ro mất việc']
    },
    challenges: [
      'Thiếu hoàn toàn kiến thức về đầu tư và quản lý tài chính cá nhân, chưa từng đọc sách hay tham gia khóa học nào',
      'Thu nhập 18 triệu/tháng không cao so với mặt bằng chung, trong khi chi phí sinh hoạt TP.HCM ngày càng tăng',
      'Không có thói quen theo dõi chi tiêu, không biết tiền đã tiêu vào đâu và bắt đầu tiết kiệm từ khâu nào',
      'Áp lực xã hội rất lớn về lifestyle: phải ăn ở những nơi "sang", mặc đồ hiệu, đi du lịch để "sống ảo"',
      'Thiếu kỷ luật tài chính: thường mua sắm impulse khi stress, không có kế hoạch chi tiêu hàng tháng',
      'Môi trường làm việc khuyến khích chi tiêu: đồng nghiệp thường rủ đi ăn, cafe, karaoke mà khó từ chối',
      'Chưa có mục tiêu tài chính cụ thể và deadline rõ ràng, sống "qua ngày" mà không nghĩ đến tương lai',
      'Thiếu hiểu biết về lạm phát và sức mua: tưởng 18 triệu/tháng là "ổn" mà không nhận ra cần tăng trưởng tài sản'
    ],
    goals: [
      'Tiết kiệm được 5.4 triệu/tháng (30% thu nhập) một cách ổn định trong vòng 12 tháng đầu',
      'Xây dựng quỹ khẩn cấp 108 triệu (6 tháng lương) để đối phó với rủi ro mất việc hoặc ốm đau',
      'Bắt đầu đầu tư an toàn với 2-3 triệu/tháng vào ETF và cổ phiếu blue-chip, mục tiêu ROI 8-12%/năm',
      'Tích lũy 800 triệu - 1 tỷ trong 5-7 năm để làm vốn mua nhà (20-25% giá trị căn hộ 3-4 tỷ)',
      'Tăng thu nhập lên 25-30 triệu/tháng thông qua thăng tiến và thu nhập phụ trong 3 năm tới',
      'Xây dựng kiến thức tài chính vững chắc để tự tin đưa ra quyết định đầu tư độc lập',
      'Tạo thói quen quản lý tài chính bền vững, không bị "cám dỗ" bởi chi tiêu impulse',
      'Chuẩn bị tài chính cho các milestone lớn: kết hôn, sinh con, mua xe, đầu tư bất động sản thứ 2'
    ],
    analysis: {
      income: [
        'Thu nhập gross: 18 triệu/tháng',
        'Thuế TNCN + BHXH: ~1.2 triệu',
        'Thu nhập net: ~16.8 triệu',
        'Tăng trưởng dự kiến: 10-15%/năm',
        'Tiềm năng freelance: +3-5 triệu/tháng'
      ],
      expenses: [
        'Thuê nhà: 8 triệu (47%)',
        'Ăn uống: 3 triệu (18%)',
        'Đi lại: 2 triệu (12%)',
        'Quần áo: 1.5 triệu (9%)',
        'Giải trí: 2 triệu (12%)',
        'Khác: 1.5 triệu (2%)',
        '→ Tiết kiệm hiện tại: 0 triệu (0%)'
      ]
    },
    insight: 'Ở giai đoạn đầu sự nghiệp, tỷ lệ tiết kiệm 20–30% cùng việc nâng cấp kỹ năng (để tăng thu nhập 10–15%/năm) sẽ quyết định tốc độ tích lũy. Ưu tiên quỹ khẩn cấp 3–6 tháng chi phí trước khi đầu tư đều đặn theo DCA vào sản phẩm rủi ro vừa phải.',
    microTasks: {
      daily: [
        'Ghi chép mọi khoản chi trong 5 phút',
        'Đọc 10 phút về kỹ năng/thu nhập phụ',
        'Kiểm tra số dư và mục tiêu tiết kiệm'
      ],
      monthly: [
        'Đánh giá tỷ lệ tiết kiệm và điều chỉnh ngân sách',
        'Cập nhật CV/portfolio và nộp 2–3 cơ hội mới',
        'Đóng góp đầu tư định kỳ theo DCA'
      ]
    },
    resources: {
      books: [
        'Người giàu có nhất Babylon',
        'I Will Teach You To Be Rich (VN)' 
      ],
      courses: [
        'Quản lý tài chính cá nhân cơ bản',
        'Kỹ năng đàm phán tăng lương'
      ],
      tools: [
        'Money Lover (theo dõi chi tiêu)',
        'Google Sheets – Ngân sách 50/30/20'
      ]
    },
    planDetails: {
      phase1: {
        title: 'Tháng 1-3: Xây dựng thói quen tài chính và nhận thức về tiền bạc',
        description: 'Giai đoạn đầu tiên tập trung vào việc xây dựng nền tảng tư duy tài chính đúng đắn và các thói quen quản lý tiền bạc cơ bản. Đây là bước quan trọng nhất quyết định thành công của toàn bộ kế hoạch.',
        actions: [
          '📱 TUẦN 1-2: Cài đặt Money Lover/Misa → Ghi chép 100% chi tiêu → Phân loại 4 nhóm: Cần thiết (50%), Muốn có (30%), Tiết kiệm (15%), Đầu tư (5%)',
          '💰 TUẦN 3-4: Mở tài khoản tiết kiệm VPBank/Techcombank (6-7%/năm) → Auto-transfer 3 triệu ngày 1 hàng tháng → Thiết lập mục tiêu 90 triệu sau 1 năm',
          '📚 THÁNG 2: Đọc "Dạy con làm giàu" + "Nhà đầu tư thông minh" → Tham gia 3 group FB tài chính → Ghi chép 10 insight quan trọng',
          '🎯 THÁNG 3: Thử thách 30 ngày cắt giảm coffee shop/grab food/shopping impulse → Tiết kiệm thêm 1-2 triệu → Đánh giá kết quả và điều chỉnh'
        ],
        expectedResults: 'Sau 3 tháng, Tuấn sẽ có cái nhìn rõ ràng về dòng tiền của mình, tiết kiệm được ít nhất 4-5 triệu/tháng và hình thành thói quen quản lý tài chính tốt.'
      },
      phase2: {
        title: 'Tháng 4-6: Tối ưu hóa thu nhập và bắt đầu đầu tư thông minh',
        description: 'Giai đoạn "tăng tốc" này tập trung vào việc đa dạng hóa nguồn thu nhập và bắt đầu cho tiền "làm việc". Đây là lúc Tuấn chuyển từ "tiết kiệm thụ động" sang "tăng trưởng tích cực" thông qua đầu tư có chiến lược và phát triển kỹ năng tạo thu nhập.',
        actions: [
          '💼 THÁNG 4: Chuẩn bị đàm phán tăng lương bằng cách: (1) Lập portfolio thành tích 6 tháng qua, (2) Nghiên cứu mức lương thị trường cho vị trí Marketing Senior (22-28 triệu), (3) Đề xuất plan đóng góp cụ thể cho công ty trong 6 tháng tới. Mục tiêu tăng lương 15-20% lên 21-22 triệu/tháng.',
          '🚀 Song song THÁNG 4: Khởi động thu nhập phụ qua freelance marketing. Tạo profile trên Upwork, Fiverr, TopCV Freelancer. Mục tiêu ban đầu: 1-2 project nhỏ (social media setup, content planning) = +2-3 triệu/tháng. Lợi thế: Kinh nghiệm 3 năm + hiểu thị trường Việt Nam.',
          '📈 THÁNG 5: "Đại học Đầu tư cấp tốc" - Học kiến thức đầu tư chuyên sâu qua: (1) Khóa online "Đầu tư chứng khoán từ A-Z" của FinanceGuru, (2) Đọc sách "The Intelligent Investor" phiên bản tiếng Việt, (3) Follow 3-5 KOL đầu tư uy tín như Shark Bình, Dragon Capital, VIC Group để học trend thị trường.',
          '🏦 THÁNG 6: Mở tài khoản chứng khoán tại SSI hoặc VPS (phí giao dịch thấp, app thân thiện). Bắt đầu đầu tư thực tế với 2 triệu/tháng theo chiến lược bảo thủ: 50% FUEVFVND (ETF theo dõi VN30), 30% cổ phiếu blue-chip (VIC, VCB, MSN, FPT), 20% trái phiếu doanh nghiệp AAA.',
          '🎯 Tạo "Investment Journal" để track hiệu suất đầu tư, ghi chép lý do mua/bán, và học từ những quyết định đúng/sai. Mục tiêu: ROI 8-12%/năm, quan trọng hơn là xây dựng kinh nghiệm và tâm lý đầu tư ổn định.',
          '📊 Thiết lập dashboard theo dõi tài chính toàn diện: Thu nhập chính + phụ, tỷ lệ tiết kiệm, giá trị portfolio, net worth. Cập nhật hàng tuần để có cảm giác "progress" rõ ràng.',
        ],
        expectedResults: '🎯 KẾT QUẢ THÁNG 4-6: Thu nhập tăng từ 18 triệu lên 23-25 triệu/tháng (lương chính + freelance). Portfolio đầu tư đầu tiên trị giá 12-15 triệu với chiến lược đa dạng hóa rủi ro. Quan trọng nhất: Từ "nhân viên marketing" trở thành "nhà đầu tư kiêm marketer", tự tin với các quyết định tài chính và có roadmap rõ ràng cho 3-5 năm tới.'
      },
      phase3: {
        title: 'Tháng 7-12: Triển khai đầu tư thực tế và xây dựng tài sản dài hạn',
        description: 'Giai đoạn quan trọng nhất khi Tuấn bắt đầu chuyển từ người tiết kiệm thành nhà đầu tư. Đây là lúc anh học cách làm cho tiền "sinh tiền" và xây dựng nền tảng cho việc mua nhà trong tương lai.',
        actions: [
          'Bắt đầu đầu tư định kỳ 3 triệu/tháng vào quỹ ETF Việt Nam (FUEVFVND, VFMVN30) với tỷ lệ 70-30',
          'Phân bổ 1 triệu/tháng đầu tư vào cổ phiếu blue-chip (VIC, VCB, GAS, MSN) theo phương pháp DCA',
          'Dành 500k/tháng thử nghiệm đầu tư cryptocurrency (Bitcoin, Ethereum) qua sàn Binance hoặc Remitano',
          'Tham gia các hội thảo, seminar về đầu tư để mở rộng kiến thức và kết nối',
          'Xây dựng spreadsheet theo dõi hiệu suất đầu tư và điều chỉnh portfolio hàng quý',
          'Nghiên cứu thị trường bất động sản khu vực TP.HCM, xác định mục tiêu mua nhà cụ thể',
          'Lập kế hoạch tiết kiệm mua nhà: mục tiêu 800 triệu - 1 tỷ trong 5-7 năm tới',
          'Tăng cường công việc freelance lên 20-25 giờ/tuần để thu thêm 5-7 triệu/tháng'
        ],
        expectedResults: 'Sau 6 tháng đầu tư, Tuấn sẽ có portfolio khoảng 30-35 triệu, hiểu biết sâu về thị trường tài chính, và kế hoạch rõ ràng cho việc mua nhà.'
      }
    },
    results: [
      'Tiết kiệm được 30% thu nhập (5.4 triệu/tháng)',
      'Có quỹ khẩn cấp 90 triệu sau 1 năm',
      'Portfolio đầu tư 24 triệu với ROI 8%',
      'Kỹ năng quản lý tài chính cá nhân vững chắc'
    ]
  },
  'family-planning': {
    title: 'Gia đình trẻ có con nhỏ',
    subtitle: 'Lập kế hoạch tài chính cho gia đình',
    icon: Heart,
    color: 'from-pink-500 to-pink-600',
    profile: {
      name: 'Gia đình anh Đức - chị Hương',
      age: '32-30 tuổi',
      job: 'Kỹ sư IT - Nhân viên ngân hàng',
      income: '65 triệu/tháng (tổng)',
      location: 'Hà Nội'
    },
    situation: 'Gia đình 2 vợ chồng (32 và 30 tuổi) tại Hà Nội, tổng thu nhập 65 triệu/tháng, đang thuê nhà và có con 3 tuổi. Cần kế hoạch tích lũy để mua nhà 3-4 tỷ và tạo quỹ giáo dục.',
    swot: {
      strengths: ['Thu nhập cao 65 triệu/tháng', '2 nguồn thu ổn định', 'Đã có kinh nghiệm quản lý tài chính', 'Động lực mạnh vì con'],
      weaknesses: ['Chi phí nuôi con cao', 'Áp lực thời gian', 'Chưa có tài sản lớn', 'Phụ thuộc vào lương'],
      opportunities: ['Mua nhà khi giá hợp lý', 'Đầu tư quỹ giáo dục', 'Thu nhập phụ từ 2 người', 'Hỗ trợ từ gia đình'],
      threats: ['Giá nhà tăng nhanh', 'Chi phí giáo dục tăng', 'Rủi ro sức khỏe', 'Lạm phát']
    },
    challenges: [
      'Chi phí nuôi con ngày càng tăng',
      'Cần quỹ giáo dục lớn cho tương lai',
      'Áp lực mua nhà với giá cao',
      'Cân bằng giữa hiện tại và tương lai'
    ],
    goals: [
      'Mua nhà 4-5 tỷ trong 3 năm',
      'Tạo quỹ giáo dục 500 triệu',
      'Bảo hiểm toàn diện cho gia đình',
      'Thu nhập thụ động 10 triệu/tháng'
    ],
    analysis: {
      income: [
        'Thu nhập gross gia đình: 65 triệu/tháng',
        'Thuế TNCN + BHXH (ước tính): ~5 triệu',
        'Thu nhập net: ~60 triệu/tháng',
        'Tiềm năng tăng thêm: +8-10 triệu/tháng (freelance IT, tư vấn tài chính)'
      ],
      expenses: [
        'Thuê nhà: 15 triệu (25%)',
        'Ăn uống & sinh hoạt: 12 triệu (20%)',
        'Con nhỏ (sữa, tã, mầm non): 8 triệu (13%)',
        'Đi lại: 3 triệu (5%)',
        'Bảo hiểm & y tế: 2 triệu (3%)',
        'Khác: 5 triệu (8%)',
        '→ Tiết kiệm hiện tại: ~15 triệu (25%)'
      ]
    },
    insight: 'Ưu tiên quỹ khẩn cấp 6 tháng và bảo hiểm đầy đủ. Duy trì tỷ lệ DTI trả góp nhà < 40% thu nhập ròng; tách riêng quỹ giáo dục và quỹ mua nhà để kiểm soát mục tiêu.',
    microTasks: {
      daily: [
        'Ghi chi tiêu gia đình theo danh mục',
        'Theo dõi chi phí con nhỏ (sữa/tã/học phí)',
        'Kiểm tra số dư quỹ mua nhà & giáo dục'
      ],
      monthly: [
        'Soát lại hóa đơn cố định và tối ưu',
        'Chuyển tiền tự động vào 2 quỹ mục tiêu',
        'Rà soát bảo hiểm và cập nhật nhu cầu'
      ]
    },
    resources: {
      books: ['Bố mẹ thông thái về tiền bạc', 'All About Asset Allocation (VN)'],
      courses: ['Lập ngân sách gia đình thực tế', 'Mua nhà lần đầu – Quy trình & pháp lý'],
      tools: ['Template ngân sách gia đình', 'Lịch chuyển tiền tự động theo mục tiêu']
    },
    planDetails: {
      phase1: {
        title: 'Năm 1: Tối ưu hóa chi tiêu gia đình và xây dựng nền tảng tài chính vững chắc',
        description: 'Giai đoạn đầu tiên tập trung vào việc hiểu rõ dòng tiền gia đình, tối ưu hóa các khoản chi và tạo ra các quỹ tiết kiệm cơ bản. Đây là nền tảng quan trọng cho các mục tiêu dài hạn.',
        actions: [
          'Thực hiện audit toàn diện chi tiêu gia đình trong 3 tháng đầu, phân loại thành: cần thiết (60%), mong muốn (25%), tiết kiệm (15%)',
          'Tối ưu hóa chi phí nuôi con: chuyển sang mua sữa bột theo thùng, tã giấy theo kiện, tìm trường mầm non chất lượng nhưng hợp lý hơn',
          'Thiết lập hệ thống tiết kiệm tự động: 20 triệu/tháng vào quỹ mua nhà, 8 triệu/tháng vào quỹ khẩn cấp',
          'Mua bảo hiểm nhân thọ cho cả 2 vợ chồng (mỗi người 500 triệu VNĐ) và bảo hiểm sức khỏe gia đình',
          'Khởi động quỹ giáo dục cho Bảo An với 5 triệu/tháng, đầu tư vào quỹ ETF giáo dục dài hạn',
          'Nghiên cứu thị trường bất động sản Hà Nội: khu vực nào phù hợp, giá cả ra sao, xu hướng tăng giá',
          'Tăng thu nhập phụ: anh Đức làm freelance IT, chị Hương tư vấn tài chính part-time, mục tiêu thêm 8-10 triệu/tháng'
        ],
        expectedResults: 'Sau 12 tháng, gia đình sẽ có quỹ mua nhà 240 triệu, quỹ khẩn cấp 96 triệu, quỹ giáo dục 60 triệu, và thu nhập tăng thêm 8-10 triệu/tháng.'
      },
      phase2: {
        title: 'Năm 2: Triển khai đầu tư tích cực và chuẩn bị mua nhà',
        description: 'Với nền tảng tài chính đã ổn định, gia đình bắt đầu đầu tư mạnh mẽ hơn và chuẩn bị cụ thể cho việc mua nhà. Đây là giai đoạn quyết định để đạt được mục tiêu sở hữu nhà riêng.',
        actions: [
          'Triển khai chiến lược đầu tư đa dạng: 15 triệu/tháng vào danh mục cổ phiếu blue-chip (VCB, VIC, VHM, GAS) và quỹ ETF',
          'Tăng cường quỹ mua nhà lên 30 triệu/tháng nhờ thu nhập tăng thêm từ công việc phụ',
          'Mở rộng quỹ giáo dục lên 10 triệu/tháng, đầu tư vào các quỹ giáo dục quốc tế',
          'Khảo sát thực tế 15-20 dự án bất động sản, so sánh giá cả, vị trí, tiền ích',
          'Thiết lập mối quan hệ với 3-4 ngân hàng để đàm phán lãi suất vay mua nhà tốt nhất',
          'Chuẩn bị hồ sơ vay: chứng minh thu nhập, sổ tiết kiệm, bảng điểm tín dụng',
          'Học cách đàm phán giá nhà và kiểm tra pháp lý bất động sản'
        ],
        expectedResults: 'Cuối năm 2, gia đình sẽ có quỹ mua nhà 600 triệu, portfolio đầu tư 180 triệu, quỹ giáo dục 180 triệu và sẵn sàng thực hiện giao dịch mua nhà.'
      },
      phase3: {
        title: 'Năm 3: Thực hiện mua nhà và tối ưu hóa tài chính sau mua nhà',
        description: 'Giai đoạn cuối cùng để hoàn thành mục tiêu sở hữu nhà riêng và điều chỉnh lại toàn bộ kế hoạch tài chính gia đình phù hợp với tình hình mới.',
        actions: [
          'Thực hiện giao dịch mua nhà: đàm phán giá cuối cùng, ký hợp đồng, hoàn tất thủ tục vay ngân hàng',
          'Sử dụng 800 triệu quỹ mua nhà + vay 3.2 tỷ (80%) để mua căn hộ 4 tỷ ở khu vực Thanh Xuân hoặc Cầu Giấy',
          'Tối ưu hóa khoản vay: chọn gói lãi suất thả nổi hoặc cố định phù hợp, thiết lập auto-debit',
          'Điều chỉnh ngân sách gia đình: giảm tiền thuê nhà nhưng tăng tiền trả góp, quản lý phí quản lý chung cư',
          'Duy trì đầu tư dài hạn: tiếp tục 10 triệu/tháng vào cổ phiếu và quỹ ETF',
          'Tăng quỹ giáo dục lên 12 triệu/tháng khi Bảo An chuẩn bị vào lớp 1',
          'Lập kế hoạch tài chính giai đoạn tiếp theo: mua xe gia đình, đầu tư bất động sản thứ 2'
        ],
        expectedResults: 'Gia đình sở hữu căn hộ 4 tỷ, quỹ giáo dục 300 triệu, portfolio đầu tư 400 triệu, và kế hoạch tài chính ổn định cho 10 năm tiếp theo.'
      }
    },
    results: [
      'Mua được nhà 4.5 tỷ với 70% vay ngân hàng',
      'Quỹ giáo dục 180 triệu sau 3 năm',
      'Portfolio đầu tư 400 triệu',
      'Bảo hiểm toàn diện cho cả gia đình'
    ]
  },
  'mid-career': {
    title: 'Người trung niên 35-45 tuổi',
    subtitle: 'Tối ưu hóa tài chính và đầu tư',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    profile: {
      name: 'Anh Hoàng Minh',
      age: 42,
      job: 'Giám đốc kinh doanh',
      income: '75 triệu/tháng',
      location: 'TP.HCM'
    },
    situation: 'Có thu nhập cao và ổn định, đã có nhà và xe. Muốn tối ưu hóa đầu tư để nghỉ hưu sớm và tạo thu nhập thụ động.',
    swot: {
      strengths: ['Thu nhập cao 75 triệu/tháng', 'Kinh nghiệm quản lý', 'Đã có tài sản cơ bản', 'Network rộng'],
      weaknesses: ['Áp lực công việc cao', 'Ít thời gian nghiên cứu đầu tư', 'Rủi ro tập trung vào lương', 'Thuế cao'],
      opportunities: ['Đầu tư BĐS cho thuê', 'Quỹ ETF quốc tế', 'Startup investment', 'Nghỉ hưu sớm'],
      threats: ['Suy thoái kinh tế', 'Thay đổi ngành nghề', 'Lạm phát cao', 'Rủi ro sức khỏe']
    },
    challenges: [
      'Cần đa dạng hóa danh mục đầu tư',
      'Tối ưu hóa thuế thu nhập cá nhân',
      'Cân bằng rủi ro và lợi nhuận',
      'Lập kế hoạch nghỉ hưu sớm'
    ],
    goals: [
      'Tạo thu nhập thụ động 50 triệu/tháng',
      'Nghỉ hưu ở tuổi 55',
      'Đầu tư bất động sản cho thuê',
      'Xây dựng quỹ giáo dục con 1 tỷ'
    ],
    analysis: {
      income: [
        'Thu nhập gross: 75 triệu/tháng',
        'Thuế TNCN + BHXH (ước tính): ~6 triệu',
        'Thu nhập net: ~69 triệu/tháng',
        'Tiềm năng thưởng/năm: 1.5-2 tháng lương'
      ],
      expenses: [
        'Nhà (vay/thuê): 12 triệu (17%)',
        'Gia đình & con cái: 10 triệu (14%)',
        'Ăn uống & sinh hoạt: 8 triệu (11%)',
        'Đi lại: 3 triệu (4%)',
        'Bảo hiểm & y tế: 3 triệu (4%)',
        'Khác: 5 triệu (7%)',
        '→ Tiền dành để tích lũy/đầu tư: ~28 triệu (40%)'
      ]
    },
    insight: 'Ở giai đoạn 35–45, tối ưu thuế, tái cân bằng theo mục tiêu nghỉ hưu và tăng tỷ trọng tài sản tạo dòng tiền (cổ tức/cho thuê) để giảm rủi ro tập trung.',
    microTasks: {
      daily: ['Xem hiệu suất danh mục 5 phút', 'Ghi chú rủi ro/kịch bản', 'Đi bộ 20 phút duy trì sức khỏe'],
      monthly: ['Tái cân bằng theo biên độ mục tiêu', 'Rà soát bảo hiểm/thuế', 'Cập nhật kế hoạch nghỉ hưu']
    },
    resources: {
      books: ['The Bogleheads’ Guide to Investing (VN)', 'Your Money or Your Life (VN)'],
      courses: ['ETF & cổ phiếu nâng cao', 'Tối ưu thuế TNCN'],
      tools: ['Bảng theo dõi tài sản ròng', 'Máy tính FIRE']
    },
    planDetails: {
      phase1: {
        title: 'Năm 1-2: Tối ưu hóa và đa dạng hóa',
        actions: [
          'Phân tích và tối ưu danh mục hiện tại',
          'Đầu tư 40 triệu/tháng vào cổ phiếu blue-chip',
          'Mua bất động sản cho thuê đầu tiên',
          'Tối ưu hóa thuế qua các kênh hợp pháp'
        ]
      },
      phase2: {
        title: 'Năm 3-5: Mở rộng đầu tư',
        actions: [
          'Đầu tư quốc tế qua ETF và cổ phiếu nước ngoài',
          'Mở rộng danh mục bất động sản',
          'Tham gia đầu tư startup và private equity',
          'Xây dựng passive income từ nhiều nguồn'
        ]
      },
      phase3: {
        title: 'Năm 6-10: Chuẩn bị nghỉ hưu',
        actions: [
          'Chuyển sang đầu tư bảo thủ hơn',
          'Hoàn thiện kế hoạch nghỉ hưu',
          'Tối đa hóa thu nhập thụ động',
          'Chuẩn bị chuyển giao tài sản'
        ]
      }
    },
    results: [
      'Thu nhập thụ động 45 triệu/tháng từ đầu tư',
      'Danh mục đầu tư 8 tỷ với ROI 12%',
      '3 căn hộ cho thuê mang về 25 triệu/tháng',
      'Sẵn sàng nghỉ hưu ở tuổi 55'
    ]
  },
  'entrepreneur': {
    title: 'Doanh nhân khởi nghiệp',
    subtitle: 'Quản lý tài chính doanh nghiệp và cá nhân',
    icon: Target,
    color: 'from-purple-500 to-purple-600',
    profile: {
      name: 'Chị Lan Phương',
      age: 35,
      job: 'CEO Startup Fintech',
      income: '50-150 triệu/tháng (biến động)',
      location: 'Hà Nội'
    },
    situation: 'Điều hành startup công nghệ tài chính, thu nhập không ổn định. Cần quản lý dòng tiền cá nhân và doanh nghiệp hiệu quả.',
    swot: {
      strengths: ['Kinh nghiệm khởi nghiệp', 'Hiểu biết fintech', 'Network đầu tư', 'Tư duy kinh doanh'],
      weaknesses: ['Thu nhập không ổn định', 'Áp lực cao', 'Ít thời gian cá nhân', 'Rủi ro cao'],
      opportunities: ['Gọi vốn thành công', 'Exit strategy', 'Mở rộng thị trường', 'IPO trong tương lai'],
      threats: ['Cạnh tranh gay gắt', 'Thay đổi quy định', 'Khủng hoảng tài chính', 'Burn rate cao']
    },
    challenges: [
      'Thu nhập biến động mạnh theo doanh thu',
      'Cần vốn cho mở rộng kinh doanh',
      'Quản lý rủi ro tài chính cao',
      'Cân bằng đầu tư cá nhân và công ty'
    ],
    goals: [
      'Ổn định dòng tiền cá nhân',
      'Gọi vốn Series A 5 triệu USD',
      'Xây dựng quỹ khẩn cấp 500 triệu',
      'Đa dạng hóa nguồn thu nhập'
    ],
    analysis: {
      income: [
        'Thu nhập biến động: 50-150 triệu/tháng',
        'Trung bình lăn 6 tháng: ~85 triệu/tháng',
        'Tỷ lệ tháng cao/tháng thấp: 5/7'
      ],
      expenses: [
        'Chi phí công việc (tool, license): 3 triệu',
        'Thuế khoán/Thuế theo quý',
        'Sinh hoạt cá nhân: 15 triệu',
        '→ Quỹ đệm thu nhập: giữ 6 tháng chi phí cá nhân (~150 triệu)'
      ]
    },
    insight: 'Quỹ đệm 6–9 tháng, cơ chế pay-yourself-first và tách tài khoản thuế. Đa dạng nguồn khách hàng để ổn định dòng tiền.',
    microTasks: {
      daily: ['Theo dõi pipeline khách hàng', 'Ghi thu–chi theo dự án', 'Học 30 phút kỹ năng bán hàng/định giá'],
      monthly: ['Cập nhật bảng giá', 'Trích lập thuế & quỹ khẩn cấp', 'Đánh giá tỉ lệ lấp đầy lịch']
    },
    resources: {
      books: ['Company of One (VN)', 'The Freelance Manifesto (VN)'],
      courses: ['Tài chính cho freelancer', 'Xây thương hiệu cá nhân'],
      tools: ['Time tracking & invoicing', 'Bảng dự báo dòng tiền theo dự án']
    },
    planDetails: {
      phase1: {
        title: 'Quý 1-2: Ổn định tài chính cá nhân',
        actions: [
          'Tách biệt tài chính cá nhân và doanh nghiệp',
          'Tạo quỹ khẩn cấp 6 tháng chi phí',
          'Mua bảo hiểm rủi ro nghề nghiệp',
          'Thiết lập lương cố định cho bản thân'
        ]
      },
      phase2: {
        title: 'Quý 3-4: Chuẩn bị gọi vốn',
        actions: [
          'Hoàn thiện mô hình tài chính công ty',
          'Xây dựng pitch deck và business plan',
          'Kết nối với các quỹ đầu tư',
          'Tối ưu hóa định giá công ty'
        ]
      },
      phase3: {
        title: 'Năm 2: Mở rộng và đầu tư',
        actions: [
          'Thực hiện gọi vốn thành công',
          'Mở rộng thị trường và sản phẩm',
          'Đầu tư cá nhân vào các startup khác',
          'Xây dựng portfolio đầu tư đa dạng'
        ]
      }
    },
    results: ['Ổn định thu nhập trung bình 28 triệu/tháng', 'Quỹ đệm 4-6 tháng', 'Giảm biến động dòng tiền']
  },
  'high-earner': {
    title: 'Người có thu nhập cao',
    subtitle: 'Tối ưu hóa tài sản và đầu tư',
    icon: TrendingUp,
    color: 'from-yellow-500 to-yellow-600',
    profile: {
      name: 'Anh Quang',
      age: 38,
      job: 'Giám đốc kỹ thuật',
      income: '120-300 triệu/tháng',
      location: 'TP.HCM'
    },
    situation: 'Thu nhập cao, nhu cầu tối ưu sau thuế và đa dạng hóa địa lý/tài sản.',
    swot: {
      strengths: ['Thu nhập rất cao 120-300 triệu', 'Vị trí cao trong công ty', 'Kiến thức kỹ thuật sâu', 'Khả năng đầu tư lớn'],
      weaknesses: ['Thuế cao', 'Áp lực công việc', 'Ít thời gian', 'Rủi ro tập trung'],
      opportunities: ['Đầu tư quốc tế', 'Family office', 'Angel investment', 'Tối ưu thuế'],
      threats: ['Thay đổi chính sách thuế', 'Rủi ro ngành', 'Biến động thị trường', 'Rủi ro địa chính trị']
    },
    challenges: ['Rủi ro tập trung', 'Gánh nặng thuế', 'Quản lý tài sản phức tạp'],
    goals: ['Hiệu quả sau thuế tối đa', 'Thu nhập thụ động 60 triệu/tháng', 'Đa dạng hóa quốc tế'],
    analysis: {
      income: ['Lương + thưởng: 120-300 triệu/tháng'],
      expenses: ['Chi tiêu cao cấp: 40-70 triệu', 'Đầu tư: 50-120 triệu']
    },
    insight: 'Tối ưu hiệu quả sau thuế và đa dạng hóa địa lý/tài sản quan trọng hơn lợi nhuận danh nghĩa. Xây cấu trúc pháp lý & family office sớm.',
    microTasks: {
      daily: ['Theo dõi vĩ mô & FX', 'Ghi chú rủi ro theo kịch bản', 'Rà soát cơ hội quốc tế'],
      monthly: ['Đánh giá hiệu quả sau thuế', 'Tái cân bằng theo dải mục tiêu', 'Cập nhật kế hoạch thừa kế/charity']
    },
    resources: {
      books: ['Rich Dad’s Guide to Investing (VN)', 'The Millionaire Next Door (VN)'],
      courses: ['Đa dạng hóa quốc tế & quản trị rủi ro', 'Cấu trúc thuế nâng cao'],
      tools: ['Dashboard tài sản đa quốc gia', 'Theo dõi phân bổ tài sản mục tiêu']
    },
    planDetails: {
      phase1: { title: 'Năm 1-2: Cấu trúc và bảo vệ', actions: ['Rà soát thuế', 'Bảo hiểm tài sản & con người', 'Thiết lập SPV nếu cần'] },
      phase2: { title: 'Năm 3-5: Đa dạng hóa', actions: ['ETF quốc tế', 'BĐS cho thuê', 'VC/PE tỉ lệ nhỏ'] },
      phase3: { title: 'Năm 6+: Tối ưu dài hạn', actions: ['Family office', 'Kế hoạch thừa kế/charity', 'Quản trị rủi ro tổng thể'] }
    },
    results: ['Tài sản tăng trưởng đều sau thuế', 'Rủi ro tập trung giảm rõ rệt', 'Chiến lược toàn diện dài hạn']
  },
  'career-transition': {
    title: 'Người chuyển đổi nghề nghiệp',
    subtitle: 'Quản lý tài chính trong thời kỳ chuyển đổi',
    icon: Target,
    color: 'from-red-500 to-red-600',
    profile: {
      name: 'Trần Huy',
      age: 29,
      job: 'Nhân viên vận hành (đang học IT)',
      income: '0-15 triệu/tháng (giai đoạn học)',
      location: 'Đà Nẵng'
    },
    situation: 'Tạm giảm thu nhập để học nghề mới; cần quỹ đệm 6-8 tháng và lộ trình học tập thực tế.',
    swot: {
      strengths: ['Quyết tâm thay đổi', 'Kinh nghiệm làm việc', 'Tuổi trẻ linh hoạt', 'Động lực học hỏi'],
      weaknesses: ['Thu nhập thấp tạm thời', 'Thiếu kinh nghiệm IT', 'Áp lực tài chính', 'Cạnh tranh cao'],
      opportunities: ['Ngành IT phát triển', 'Remote work', 'Freelance opportunities', 'Lương cao sau chuyển đổi'],
      threats: ['Hết tiền trước khi có việc', 'Công nghệ thay đổi nhanh', 'Cạnh tranh từ fresh graduate', 'Áp lực gia đình']
    },
    challenges: ['Chi phí sinh hoạt tối thiểu', 'Áp lực học & thực tập', 'Rủi ro kéo dài thời gian chuyển đổi'],
    goals: ['Hoàn thành chuyển đổi 12-18 tháng', 'Việc mới lương 20-30 triệu', 'Duy trì quỹ đệm tối thiểu'],
    analysis: {
      income: ['Thu nhập thấp/0 trong giai đoạn học'],
      expenses: ['Chi tiêu tối thiểu: 8-10 triệu/tháng']
    },
    insight: 'Duy trì quỹ đệm 6–8 tháng để vượt giai đoạn học & thực tập; ưu tiên chi tiêu thiết yếu và tập trung học để phục hồi thu nhập sớm.',
    microTasks: {
      daily: ['Lập lịch học hằng ngày', 'Ghi chi tiêu tối thiểu', 'Tìm 1–2 job freelance liên quan'],
      monthly: ['Rà soát tiến độ học/chứng chỉ', 'Cập nhật portfolio & GitHub', 'Đi meetup/networking ngành']
    },
    resources: {
      books: ['Deep Work (VN)', 'Cracking the Coding Interview (VN)'],
      courses: ['Bootcamp/chứng chỉ chuyên môn', 'Kỹ năng phỏng vấn & CV'],
      tools: ['Notion – roadmap học tập', 'Tracker chi tiêu tối thiểu']
    },
    planDetails: {
      phase1: { title: 'Tháng 1-6: Học nền tảng', actions: ['HTML/CSS/JS/CS cơ bản', '1-2 project nhỏ', 'Quản trị thời gian & thói quen'] },
      phase2: { title: 'Tháng 7-12: Thực hành & freelance', actions: ['Freelance task nhỏ', 'Hoàn thiện 3-4 project', 'Tham gia cộng đồng'] },
      phase3: { title: 'Tháng 13-18: Apply & ổn định', actions: ['Apply 100 job có chọn lọc', 'Mock interview', 'Kế hoạch tài chính sau khi đi làm'] }
    },
    results: ['Có việc làm mới 25-30 triệu', 'Quỹ đệm còn 3-4 tháng khi on-board', 'Tái thiết lập ngân sách sau chuyển đổi']
  },
  'student-graduate': {
    title: 'Sinh viên & Người mới ra trường',
    subtitle: 'Bắt đầu hành trình tài chính',
    icon: GraduationCap,
    color: 'from-orange-500 to-orange-600',
    profile: { name: 'Nguyễn Thị Mai', age: 23, job: 'Sinh viên/Thực tập sinh', income: '7-10 triệu/tháng', location: 'Hà Nội' },
    situation: 'Thu nhập thấp, không ổn định; cần hình thành thói quen quản lý tiền và chuẩn bị cho công việc full-time.',
    swot: {
      strengths: ['Tuổi trẻ', 'Thời gian học tập', 'Không có gánh nặng tài chính lớn', 'Dễ thích nghi'],
      weaknesses: ['Thu nhập thấp', 'Thiếu kinh nghiệm', 'Chưa có network', 'Kiến thức tài chính hạn chế'],
      opportunities: ['Thị trường việc làm tốt', 'Học bổng/khóa học', 'Internship có lương', 'Xây dựng thói quen sớm'],
      threats: ['Cạnh tranh việc làm', 'Lạm phát', 'Áp lực gia đình', 'Chi phí sinh hoạt tăng']
    },
    challenges: ['Áp lực chi phí sinh hoạt', 'Thiếu kiến thức tài chính', 'Thu nhập part-time không đều'],
    goals: ['Tiết kiệm 1-1.5 triệu/tháng', 'Quỹ khẩn cấp 10-15 triệu', 'CV/Portfolio sẵn sàng đi làm'],
    analysis: {
      income: ['Part-time: 6-8 triệu/tháng', 'Hỗ trợ gia đình/học bổng: 1-2 triệu'],
      expenses: ['Thuê trọ: 2.5-3.5 triệu', 'Ăn uống: 2-2.5 triệu', 'Đi lại: 0.6-0.8 triệu', 'Khác: 0.8-1 triệu']
    },
    insight: 'Ưu tiên kỹ năng tạo thu nhập và thói quen tài chính. Tiết kiệm 15–20% và đầu tư vào học tập có ROI cao trước khi đầu tư tài chính.',
    microTasks: {
      daily: ['Ghi chi tiêu nhỏ', 'Học 30 phút kỹ năng nghề', 'Ôn mục tiêu tuần'],
      monthly: ['Cập nhật CV/LinkedIn & portfolio', 'Thiết lập tiết kiệm tự động', 'Đánh giá tiến độ học/chứng chỉ']
    },
    resources: {
      books: ['Atomic Habits (VN)', 'So Good They Can’t Ignore You (VN)'],
      courses: ['Excel/GSheets cho công việc', 'Giao tiếp & thuyết trình'],
      tools: ['Todoist/Notion – theo dõi học tập', 'Mẫu ngân sách sinh viên']
    },
    planDetails: {
      phase1: { title: 'Tháng 1-3: Nền tảng tài chính', actions: ['Theo dõi chi tiêu bằng app', 'Tiết kiệm 15% thu nhập', 'Hoàn thiện CV/portfolio'] },
      phase2: { title: 'Tháng 4-6: Tăng thu nhập', actions: ['Part-time liên quan chuyên môn', 'Chứng chỉ ngắn hạn', 'Đầu tư nhỏ (ETF) khi có quỹ đệm'] },
      phase3: { title: 'Tháng 7-12: Chuyển sang full-time', actions: ['Apply 10-15 job/tháng', 'Xây network ngành', 'Tăng tiết kiệm lên 20-25%'] }
    },
    results: ['Tiết kiệm 20-25 triệu sau 12 tháng', 'Có việc full-time ổn định', 'Hình thành thói quen tài chính tốt']
  },
  'retirement-planning': {
    title: 'Chuẩn bị nghỉ hưu 45-55 tuổi',
    subtitle: 'Lập kế hoạch nghỉ hưu an toàn',
    icon: Users,
    color: 'from-indigo-500 to-indigo-600',
    profile: { name: 'Ông Văn Thành', age: 52, job: 'Phó giám đốc nhà máy', income: '55-60 triệu/tháng', location: 'Bình Dương' },
    situation: 'Còn 8-10 năm tích lũy; cần tối ưu danh mục, giảm biến động và chuẩn bị chi phí y tế.',
    swot: {
      strengths: ['Thu nhập ổn định cao', 'Kinh nghiệm quản lý', 'Đã có tài sản', 'Thời gian còn lại rõ ràng'],
      weaknesses: ['Thời gian tích lũy ngắn', 'Rủi ro sức khỏe tăng', 'Ít thời gian phục hồi', 'Áp lực lớn'],
      opportunities: ['Đầu tư bảo thủ', 'Tối ưu thuế', 'Kế hoạch thừa kế', 'Thu nhập thụ động'],
      threats: ['Lạm phát', 'Khủng hoảng tài chính', 'Chi phí y tế cao', 'Thay đổi chính sách hưu trí']
    },
    challenges: ['Lạm phát', 'Rủi ro thị trường', 'Chi phí y tế tăng'],
    goals: ['Có 3-4 tỷ khi nghỉ hưu', 'Thu nhập thụ động 25 triệu/tháng', 'Bảo hiểm y tế đầy đủ'],
    analysis: {
      income: ['Thu nhập sau thuế: ~55 triệu/tháng'],
      expenses: ['Chi tiêu gia đình: 25-28 triệu', 'Đầu tư: 15-20 triệu', 'Khác: 5-7 triệu']
    },
    insight: 'Giảm rủi ro sequence of returns: ưu tiên dòng tiền ổn định, tăng tài sản ít biến động (TP, quỹ thu nhập), và kế hoạch y tế.',
    microTasks: {
      daily: ['Theo dõi sức khỏe', 'Kiểm tra dòng tiền cố định', 'Ghi chú thị trường ngắn'],
      monthly: ['Chuyển dần sang tài sản ít biến động', 'Kiểm tra bảo hiểm y tế & hưu trí', 'Cập nhật kế hoạch thừa kế']
    },
    resources: {
      books: ['The Simple Path to Wealth (VN)', 'Bogleheads’ Guide to Retirement Planning (VN)'],
      courses: ['Lập kế hoạch hưu trí', 'Quản trị rủi ro danh mục'],
      tools: ['Máy tính lạm phát & chi tiêu hưu trí', 'Tracker thu nhập thụ động']
    },
    planDetails: {
      phase1: { title: 'Năm 1-2: Củng cố nền tảng', actions: ['Xây quỹ y tế', 'Tăng tỷ trọng trái phiếu', 'Tối ưu bảo hiểm'] },
      phase2: { title: 'Năm 3-5: Tối ưu dòng tiền', actions: ['Đầu tư thu nhập định kỳ', 'Giảm cổ phiếu rủi ro cao'] },
      phase3: { title: 'Năm 6-8: Chuẩn bị nghỉ hưu', actions: ['Lập ngân sách hưu trí', 'Kế hoạch thừa kế/tài sản'] }
    },
    results: ['Dòng tiền ổn định 25 triệu/tháng', 'Danh mục ít biến động', 'Bảo vệ rủi ro sức khỏe tốt']
  },
  'freelancer': {
    title: 'Freelancer & Người làm tự do',
    subtitle: 'Quản lý thu nhập không ổn định',
    icon: Briefcase,
    color: 'from-teal-500 to-teal-600',
    profile: { name: 'Phương Linh', age: 31, job: 'Thiết kế tự do', income: '10-60 triệu/tháng', location: 'TP.HCM' },
    situation: 'Thu nhập theo dự án, biến động mạnh; cần quỹ đệm và cơ chế tách thuế.',
    swot: {
      strengths: ['Linh hoạt thời gian', 'Kỹ năng chuyên môn cao', 'Đa dạng khách hàng', 'Thu nhập tiềm năng cao'],
      weaknesses: ['Thu nhập không ổn định', 'Không có bảo hiểm xã hội', 'Áp lực tìm khách', 'Cô đơn trong công việc'],
      opportunities: ['Mở rộng dịch vụ', 'Xây dựng thương hiệu', 'Passive income', 'Đào tạo người khác'],
      threats: ['Mất khách hàng lớn', 'Cạnh tranh giá', 'Thay đổi công nghệ', 'Suy thoái kinh tế']
    },
    challenges: ['Dòng tiền không đều', 'Thuế theo quý', 'Phụ thuộc khách hàng lớn'],
    goals: ['Quỹ đệm 6-9 tháng', 'Tỷ lệ lấp đầy lịch 70%+', 'Thu nhập thụ động 5 triệu/tháng'],
    analysis: { income: ['Tháng cao: 50-60 triệu', 'Tháng thấp: 5-10 triệu'], expenses: ['Sinh hoạt: 12-18 triệu', 'Công cụ: 2-3 triệu', 'Thuế trích trước: 5-10%'] },
    insight: 'Quỹ đệm 6–9 tháng, pay-yourself-first và tách tài khoản thuế. Đa dạng hóa khách hàng/ứng dụng.',
    microTasks: { daily: ['Theo dõi pipeline khách hàng', 'Ghi thu–chi theo dự án', 'Học 30 phút kỹ năng bán hàng/định giá'], monthly: ['Cập nhật bảng giá', 'Trích lập thuế & quỹ khẩn cấp', 'Đánh giá tỉ lệ lấp đầy lịch'] },
    resources: { books: ['Company of One (VN)', 'The Freelance Manifesto (VN)'], courses: ['Tài chính cho freelancer', 'Xây thương hiệu cá nhân'], tools: ['Time tracking & invoicing', 'Bảng dự báo dòng tiền theo dự án'] },
    planDetails: {
      phase1: { title: 'Tháng 1-3: Ổn định dòng tiền', actions: ['Tách tài khoản thuế', 'Thiết lập lương cố định', 'Xây quỹ đệm 3 tháng'] },
      phase2: { title: 'Tháng 4-6: Mở rộng khách hàng', actions: ['Xây profile', 'Outbound 20 khách/tháng', 'Referrals'] },
      phase3: { title: 'Tháng 7-12: Tối ưu hóa', actions: ['Chuẩn hóa quy trình', 'Tăng giá theo giá trị', 'Tự động hóa thu–chi'] }
    },
    results: ['Ổn định thu nhập trung bình 28 triệu/tháng', 'Quỹ đệm 4-6 tháng', 'Giảm biến động dòng tiền']
  }
}

export default function UseCaseDetailPage({ params }: { params: { id: string } }) {
  const useCase = useCaseDetails[params.id as keyof typeof useCaseDetails]
  
  if (!useCase) {
    notFound()
  }

  const IconComponent = useCase.icon

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-20">
        {/* Header */}
        <div className={`bg-gradient-to-r ${useCase.color} text-white py-16`}>
          <div className="max-w-6xl mx-auto px-4">
            <Link href="/use-cases" className="inline-flex items-center text-white/80 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Use Cases
            </Link>
            
            <div className="flex items-center mb-6">
              <IconComponent className="w-12 h-12 mr-4" />
              <div>
                <h1 className="text-4xl font-bold mb-2">{useCase.title}</h1>
                <p className="text-xl text-white/90">{useCase.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Profile */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-2xl p-6 sticky top-8">
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">Hồ sơ khách hàng</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Tên:</span>
                    <span className="ml-2 font-semibold text-gray-900">{useCase.profile.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tuổi:</span>
                    <span className="ml-2 font-semibold text-gray-900">{useCase.profile.age}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nghề nghiệp:</span>
                    <span className="ml-2 font-semibold text-gray-900">{useCase.profile.job}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Thu nhập:</span>
                    <span className="ml-2 font-semibold text-gray-900">{useCase.profile.income}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa điểm:</span>
                    <span className="ml-2 font-semibold text-gray-900">{useCase.profile.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* 1. Lời mở đầu & Tóm tắt mục tiêu */}
              <section>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">📝 1. Tóm tắt mục tiêu</h2>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <p className="text-gray-700 leading-relaxed mb-6">{useCase.situation}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <h4 className="font-bold text-blue-800 mb-3">📊 Phân tích thu nhập hiện tại:</h4>
                      {(useCase as any).analysis?.income?.length ? (
                        <ul className="space-y-2 text-sm text-gray-700">
                          {(useCase as any).analysis.income.map((line: string, idx: number) => (
                            <li key={idx}>• {line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-purple-200">
                      <h4 className="font-bold text-purple-800 mb-3">💰 Phân tích chi tiêu hiện tại:</h4>
                      {(useCase as any).analysis?.expenses?.length ? (
                        <ul className="space-y-2 text-sm text-gray-700">
                          {(useCase as any).analysis.expenses.map((line: string, idx: number) => (
                            <li key={idx}>• {line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-bold text-blue-800 mb-3">🎯 Mục tiêu SMART được thiết lập:</h4>
                    <ul className="space-y-3">
                      {useCase.goals.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <Target className="w-4 h-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                    <h4 className="font-bold text-orange-800 mb-2">⚡ Insight quan trọng từ PlanAI:</h4>
                    <p className="text-sm text-gray-700">{(useCase as any).insight ?? 'Hãy ưu tiên quỹ khẩn cấp, duy trì tiết kiệm đều đặn và đầu tư phù hợp với mức chịu rủi ro để tăng tốc tích lũy.'}</p>
                  </div>
                </div>
              </section>

              {/* 2. Phân Tích Mục Tiêu và Tình Hình Hiện Tại */}
              <section>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">📈 2. Phân Tích Mục Tiêu và Tình Hình Hiện Tại</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-red-50 rounded-xl p-4">
                    <h4 className="font-bold text-red-800 mb-3">⚠️ Thách thức hiện tại:</h4>
                    <ul className="space-y-2">
                      {useCase.challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-bold text-green-800 mb-3">📊 Phân tích SWOT:</h4>
                    {(useCase as any).swot ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3">
                          <h5 className="font-semibold text-green-700 text-xs mb-2">💪 Điểm mạnh:</h5>
                          <ul className="text-xs space-y-1 text-gray-700">
                            {(useCase as any).swot.strengths.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <h5 className="font-semibold text-red-700 text-xs mb-2">⚠️ Điểm yếu:</h5>
                          <ul className="text-xs space-y-1 text-gray-700">
                            {(useCase as any).swot.weaknesses.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <h5 className="font-semibold text-blue-700 text-xs mb-2">🚀 Cơ hội:</h5>
                          <ul className="text-xs space-y-1 text-gray-700">
                            {(useCase as any).swot.opportunities.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <h5 className="font-semibold text-orange-700 text-xs mb-2">⚡ Thách thức:</h5>
                          <ul className="text-xs space-y-1 text-gray-700">
                            {(useCase as any).swot.threats.map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Chưa có phân tích SWOT</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 3. Lộ trình */}
              <section>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-6">🛣️ 3. Lộ trình Chi Tiết</h2>
                <div className="space-y-6">
                  {Object.entries(useCase.planDetails).map(([key, phase], phaseIndex) => {
                    // Show first 3 phases completely before blur effect
                    const totalPhases = Object.keys(useCase.planDetails).length;
                    const visiblePhases = Math.min(3, totalPhases);
                    const isBlurred = phaseIndex >= visiblePhases;
                    
                    return (
                      <div key={key} className={`relative ${isBlurred ? 'blur-sm' : ''}`}>
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                          <h3 className="text-xl font-bold text-gray-800 mb-4">{(phase as any).title}</h3>
                          {'description' in (phase as any) && (
                            <p className="text-gray-600 mb-4 leading-relaxed">{(phase as any).description}</p>
                          )}
                          <div className="space-y-3">
                            {(phase as any).actions.map((action: string, actionIndex: number) => (
                              <div key={actionIndex} className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm leading-relaxed">{action}</span>
                              </div>
                            ))}
                          </div>
                          {'expectedResults' in (phase as any) && (
                            <div className="mt-4 bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 mb-2">Kết quả mong đợi:</h4>
                              <p className="text-blue-700 text-sm">{(phase as any).expectedResults}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Blur overlay and CTA for later phases */}
                        {isBlurred && (
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent rounded-2xl flex items-center justify-center">
                            <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LockIcon className="w-8 h-8 text-white" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-800 mb-2">Chi tiết hơn 10x đang chờ bạn!</h3>
                              <p className="text-gray-600 mb-4 text-sm">Kế hoạch tài chính đầy đủ với roadmap chi tiết, bảng tính Excel, templates và 1-1 coaching.</p>
                              <Link 
                                href="/login" 
                                className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                              >
                                Đăng ký ngay - Chỉ 99k/tháng
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 4. Micro-Task Hàng Ngày và Hàng Tháng */}
              <section className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white rounded-2xl z-10 flex items-end justify-center pb-8">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-full font-semibold mb-2">
                      🔒 Nội dung độc quyền
                    </div>
                    <p className="text-gray-600">Đăng ký để xem toàn bộ micro-tasks, checklist và công cụ theo dõi</p>
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">⚙️ 4. Micro-Task Hàng Ngày & Hàng Tháng</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h4 className="font-bold text-yellow-800 mb-4">🌅 Hàng ngày (15-30 phút):</h4>
                    {((useCase as any).microTasks?.daily?.length) ? (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(useCase as any).microTasks.daily.map((item: string, idx: number) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
                    )}
                  </div>
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="font-bold text-green-800 mb-4">📅 Hàng tháng:</h4>
                    {((useCase as any).microTasks?.monthly?.length) ? (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(useCase as any).microTasks.monthly.map((item: string, idx: number) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 5. Tài Liệu Học Tập */}
              <section className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white rounded-2xl z-10 flex items-end justify-center pb-8">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-full font-semibold mb-3">
                      🔒 Thư viện tài liệu độc quyền
                    </div>
                    <p className="text-gray-600">Đăng ký để truy cập 50+ tài liệu, khóa học và công cụ</p>
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">📚 5. Tài Liệu Học Tập & Nguồn Lực</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-bold text-blue-800 mb-3">📚 Sách nên đọc:</h4>
                    {((useCase as any).resources?.books?.length) ? (
                      <ul className="text-xs space-y-1 text-gray-700">
                        {(useCase as any).resources.books.map((b: string, idx: number) => (
                          <li key={idx}>• {b}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-600">Chưa có dữ liệu</p>
                    )}
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-bold text-purple-800 mb-3">🎥 Khóa học:</h4>
                    {((useCase as any).resources?.courses?.length) ? (
                      <ul className="text-xs space-y-1 text-gray-700">
                        {(useCase as any).resources.courses.map((c: string, idx: number) => (
                          <li key={idx}>• {c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-600">Chưa có dữ liệu</p>
                    )}
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="font-bold text-green-800 mb-3">⚙️ Công cụ:</h4>
                    {((useCase as any).resources?.tools?.length) ? (
                      <ul className="text-xs space-y-1 text-gray-700">
                        {(useCase as any).resources.tools.map((t: string, idx: number) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-600">Chưa có dữ liệu</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 6. Kết Luận và Hành Động */}
              <section>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">🏁 6. Kết Luận & Hành Động Ngay</h2>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-green-800 mb-3">🎦 Kết quả dự kiến:</h4>
                      <ul className="space-y-2">
                        {useCase.results.map((result, index) => (
                          <li key={index} className="flex items-start">
                            <TrendingUp className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                            <span className="text-green-800 font-medium text-sm">{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 mb-3">⚡ Hành động ngay lập tức:</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Tải app Money Lover hoặc Misa để theo dõi chi tiêu</li>
                        <li>• Mở tài khoản tiết kiệm online với lãi suất cao</li>
                        <li>• Thiết lập auto-transfer 3 triệu/tháng vào tiết kiệm</li>
                        <li>• Đăng ký PlanAI để nhận kế hoạch tài chính đầy đủ</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Final CTA */}
              <section className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">Bạn muốn có kế hoạch cho riêng mình?</h3>
                <p className="mb-6 text-primary-100">
                  Hãy để PlanAI tạo kế hoạch tài chính cá nhân hóa cho riêng bạn
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/start" className="bg-white text-primary-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                    Bắt đầu miễn phí
                  </Link>
                  <Link href="/pricing" className="border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">
                    Xem gói dịch vụ
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
