'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, CheckCircle, TrendingUp, Target, Users, Briefcase, GraduationCap, Heart, Home, Car, Plane } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const useCases = [
  {
    id: 'young-professional',
    title: 'Người đi làm 25-30 tuổi',
    subtitle: 'Bắt đầu xây dựng tài chính cá nhân',
    description: 'Thu nhập 15-25 triệu/tháng, cần kiểm soát chi tiêu và tích lũy ban đầu',
    icon: Briefcase,
    color: 'from-blue-500 to-blue-600',
    stats: {
      income: '15-25 triệu/tháng',
      goal: 'Mua nhà, đầu tư cơ bản',
      timeline: '5-10 năm',
      skills: 'Quản lý chi tiêu, đầu tư cơ bản',
      experience: 'Mới bắt đầu'
    }
  },
  {
    id: 'family-planning',
    title: 'Gia đình trẻ có con nhỏ',
    subtitle: 'Lập kế hoạch tài chính cho gia đình',
    description: 'Thu nhập gia đình ~65 triệu/tháng, cần tích lũy mua nhà và quỹ giáo dục',
    icon: Heart,
    color: 'from-pink-500 to-pink-600',
    stats: {
      income: '30-50 triệu/tháng',
      goal: 'Giáo dục con, mua nhà lớn',
      timeline: '10-20 năm',
      skills: 'Quản lý ngân sách gia đình, bảo hiểm',
      experience: 'Trung bình'
    }
  },
  {
    id: 'mid-career',
    title: 'Người trung niên 35-45 tuổi',
    subtitle: 'Tối ưu hóa tài chính và đầu tư',
    description: 'Thu nhập 50-100 triệu/tháng, cần tối ưu danh mục và chuẩn bị nghỉ hưu',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    stats: {
      income: '50-100 triệu/tháng',
      goal: 'Tự do tài chính, nghỉ hưu sớm',
      timeline: '10-15 năm',
      skills: 'Đầu tư nâng cao, tối ưu thuế',
      experience: 'Có kinh nghiệm'
    }
  },
  {
    id: 'entrepreneur',
    title: 'Doanh nhân khởi nghiệp',
    subtitle: 'Quản lý tài chính doanh nghiệp và cá nhân',
    description: 'Thu nhập biến động theo dự án, cần quản lý dòng tiền và mở rộng bền vững',
    icon: Target,
    color: 'from-purple-500 to-purple-600',
    stats: {
      income: 'Biến động 20-200 triệu/tháng',
      goal: 'Mở rộng kinh doanh, đầu tư',
      timeline: '3-7 năm',
      skills: 'Quản lý dòng tiền, đầu tư rủi ro cao',
      experience: 'Chuyên sâu'
    }
  },
  {
    id: 'student-graduate',
    title: 'Sinh viên & Người mới ra trường',
    subtitle: 'Bắt đầu hành trình tài chính',
    description: 'Thu nhập 5-15 triệu/tháng, học cách quản lý chi tiêu và tích lũy',
    icon: GraduationCap,
    color: 'from-orange-500 to-orange-600',
    stats: {
      income: '5-15 triệu/tháng',
      goal: 'Tích lũy ban đầu, học đầu tư',
      timeline: '2-5 năm',
      skills: 'Học hỏi tài chính cơ bản',
      experience: 'Mới bắt đầu'
    }
  },
  {
    id: 'retirement-planning',
    title: 'Chuẩn bị nghỉ hưu 45-55 tuổi',
    subtitle: 'Lập kế hoạch nghỉ hưu an toàn',
    description: 'Thu nhập 40-80 triệu/tháng, tối ưu tích lũy và dòng tiền hưu trí',
    icon: Users,
    color: 'from-indigo-500 to-indigo-600',
    stats: {
      income: '40-80 triệu/tháng',
      goal: 'Nghỉ hưu thoải mái',
      timeline: '5-15 năm',
      skills: 'Đầu tư bảo thủ, quản lý rủi ro',
      experience: 'Dày dạn kinh nghiệm'
    }
  },
  {
    id: 'freelancer',
    title: 'Freelancer & Người làm tự do',
    subtitle: 'Quản lý thu nhập không ổn định',
    description: 'Thu nhập 10-60 triệu/tháng, cần quỹ đệm và kế hoạch dòng tiền',
    icon: Briefcase,
    color: 'from-teal-500 to-teal-600',
    stats: {
      income: '10-60 triệu/tháng',
      goal: 'Ổn định tài chính, tạo thu nhập thụ động',
      timeline: '3-8 năm',
      skills: 'Quản lý dòng tiền bất thường, đa dạng hóa',
      experience: 'Trung bình'
    }
  },
  {
    id: 'high-earner',
    title: 'Người có thu nhập cao',
    subtitle: 'Tối ưu hóa tài sản và đầu tư',
    description: 'Thu nhập 100-500 triệu/tháng, tối ưu thuế và phân bổ tài sản',
    icon: TrendingUp,
    color: 'from-yellow-500 to-yellow-600',
    stats: {
      income: '100-500 triệu/tháng',
      goal: 'Tối đa hóa tài sản, đầu tư quốc tế',
      timeline: '5-12 năm',
      skills: 'Đầu tư phức tạp, tối ưu thuế cao cấp',
      experience: 'Chuyên gia'
    }
  },
  {
    id: 'career-transition',
    title: 'Người chuyển đổi nghề nghiệp',
    subtitle: 'Quản lý tài chính trong thời kỳ chuyển đổi',
    description: 'Thu nhập 0-30 triệu/tháng, cần quỹ đệm và lộ trình học nghề mới',
    icon: Target,
    color: 'from-red-500 to-red-600',
    stats: {
      income: '0-30 triệu/tháng',
      goal: 'Duy trì tài chính ổn định, đầu tư vào kỹ năng',
      timeline: '1-3 năm',
      skills: 'Quản lý rủi ro, lập kế hoạch ngắn hạn',
      experience: 'Đang học hỏi'
    }
  }
]

const successStories = [
  {
    name: 'Minh Anh',
    age: 28,
    profession: 'Marketing Manager',
    story: 'Mình là một người khá bối rối về tài chính. Mặc dù có thu nhập ổn định 20 triệu/tháng nhưng cuối tháng vẫn thường hết tiền, không biết tiền đã tiêu vào đâu. Khi bắt đầu sử dụng PlanAI, điều đầu tiên mình học được là cách theo dõi chi tiêu một cách chi tiết. AI đã phân tích thói quen tiêu dùng của mình và chỉ ra những khoản chi không cần thiết như mua sắm bốc đồng và ăn uống ngoài quá nhiều. Mình bắt đầu học thêm kỹ năng digital marketing để làm thêm thu nhập và cắt giảm chi tiêu không cần thiết. Sau 6 tháng áp dụng kế hoạch, mình đã tiết kiệm được 50 triệu và có thêm thu nhập 8 triệu/tháng từ việc làm freelance marketing. Giờ mình đã có thói quen tài chính tốt và kế hoạch rõ ràng để mua nhà.',
    achievement: 'Tiết kiệm được 50 triệu và tăng thu nhập thêm 8 triệu/tháng trong 6 tháng',
    avatar: '👩‍💼'
  },
  {
    name: 'Đức Thành',
    age: 35,
    profession: 'Kỹ sư IT',
    story: 'Là trụ cột gia đình với vợ và 2 con nhỏ, tôi luôn lo lắng về việc mua nhà và chi phí giáo dục cho con. Thu nhập 45 triệu/tháng nhưng với chi phí sinh hoạt cao, tôi không biết khi nào mới đủ tiền mua nhà. PlanAI đã giúp tôi lập một kế hoạch chi tiết 12 tháng. AI phân tích thu chi của gia đình và đề xuất cách tối ưu hóa: chuyển từ thuê nhà đắt sang khu vực hợp lý hơn, cắt giảm một số dịch vụ không cần thiết, và phát triển kỹ năng coding để làm thêm dự án freelance. Tôi bắt đầu học Python và làm các dự án web nhỏ. Sau 1 năm kiên trì theo kế hoạch, gia đình tôi đã tích lũy được 400 triệu và có thêm thu nhập 12 triệu/tháng từ freelance. Giờ tôi yên tâm hơn về tương lai tài chính của gia đình.',
    achievement: 'Tích lũy được 400 triệu và tăng thu nhập thêm 12 triệu/tháng trong 1 năm',
    avatar: '👨‍💻'
  },
  {
    name: 'Thu Hương',
    age: 32,
    profession: 'Chủ quán cà phê',
    story: 'Tôi mở quán cà phê từ năm 2020, ban đầu kinh doanh khá tốt nhưng sau đó gặp nhiều khó khăn do dịch bệnh. Thu nhập không ổn định, có tháng lãi 30 triệu, có tháng lỗ 10 triệu. Tôi không biết cách quản lý dòng tiền và lập kế hoạch mở rộng. PlanAI đã giúp tôi hiểu rõ dòng tiền của quán, dự đoán được những tháng khó khăn và chuẩn bị quỹ dự phòng. AI cũng tư vấn tôi về cách tối ưu hóa chi phí và tăng doanh thu. Sau 8 tháng áp dụng kế hoạch, quán đã ổn định với lợi nhuận trung bình 25 triệu/tháng và tôi đã có đủ tự tin để chuẩn bị mở chi nhánh thứ 2. Quan trọng hơn, tôi đã học được cách quản lý tài chính doanh nghiệp một cách chuyên nghiệp.',
    achievement: 'Ổn định lợi nhuận 25 triệu/tháng sau 8 tháng',
    avatar: '👩‍💼'
  },
  {
    name: 'Hoàng Nam',
    age: 26,
    profession: 'Nhân viên ngân hàng',
    story: 'Mặc dù làm trong ngành tài chính nhưng tôi lại không giỏi quản lý tài chính cá nhân. Thu nhập 18 triệu/tháng, tôi thường xuyên vay tiền bạn bè vào cuối tháng và không có kế hoạch dài hạn nào. Khi sử dụng PlanAI, tôi mới nhận ra mình đang mắc những sai lầm cơ bản: không có quỹ khẩn cấp, chi tiêu không có kế hoạch, và quan trọng nhất là không đầu tư gì cả. AI đã tạo cho tôi một lộ trình từ cơ bản nhất: đầu tiên là cắt giảm chi tiêu và tạo quỹ khẩn cấp 3 tháng lương, sau đó bắt đầu đầu tư định kỳ vào các quỹ ETF. Sau 10 tháng, tôi không chỉ không còn phải vay tiền ai mà còn có được 60 triệu tiết kiệm. Điều quan trọng nhất là tôi đã có thói quen tài chính tốt và hiểu rõ về đầu tư.',
    achievement: 'Từ âm tiền thành có 60 triệu tiết kiệm trong 10 tháng',
    avatar: '👨‍💼'
  },
  {
    name: 'Lan Phương',
    age: 29,
    profession: 'Giáo viên',
    story: 'Là giáo viên với mức lương 12 triệu/tháng, mình luôn nghĩ rằng không thể tiết kiệm hay đầu tư được gì với mức thu nhập này. Mình sống qua ngày, không dám nghĩ đến việc mua nhà hay có kế hoạch tài chính dài hạn. PlanAI đã thay đổi hoàn toàn tư duy của mình. AI chỉ ra rằng dù thu nhập không cao nhưng mình vẫn có thể tiết kiệm 20-25% nếu có kế hoạch hợp lý. Mình bắt đầu với việc nấu ăn tại nhà thay vì ăn ngoài, sử dụng phương tiện công cộng thay vì Grab, và tìm thêm thu nhập từ dạy kèm online. Sau 8 tháng, mình đã tiết kiệm được 25 triệu và bắt đầu đầu tư vào vàng SJC định kỳ. Giờ mình tin rằng dù thu nhập không cao nhưng với kỷ luật và kế hoạch đúng đắn, mình vẫn có thể xây dựng tương lai tài chính vững chắc.',
    achievement: 'Tiết kiệm được 25% thu nhập dù lương chỉ 12 triệu',
    avatar: '👩‍🏫'
  },
  {
    name: 'Tuấn Vũ',
    age: 38,
    profession: 'Tài xế công nghệ',
    story: 'Tôi chạy Grab được 4 năm, thu nhập trung bình 22 triệu/tháng nhưng không ổn định. Có tháng 30 triệu, có tháng chỉ 15 triệu. Vợ tôi bán online thu nhập khoảng 8-10 triệu/tháng. Với 2 con nhỏ, gia đình tôi luôn trong tình trạng "đủ ăn" nhưng không có tiết kiệm gì. PlanAI đã giúp tôi lập kế hoạch tài chính phù hợp với thu nhập không ổn định. AI tư vấn tôi tạo quỹ cân bằng thu nhập: những tháng kiếm nhiều sẽ để dành cho những tháng ít. Tôi cũng học được cách tối ưu hóa chi phí gia đình và lập quỹ dự phòng. Sau 11 tháng, gia đình tôi đã ổn định hơn nhiều, có quỹ dự phòng 4 tháng và bắt đầu có kế hoạch mua nhà rõ ràng.',
    achievement: 'Có quỹ dự phòng 4 tháng sau 11 tháng áp dụng kế hoạch',
    avatar: '👨‍🚗'
  },
  {
    name: 'Mai Linh',
    age: 24,
    profession: 'Nhân viên marketing',
    story: 'Mới ra trường được 2 năm, tôi có lương 15 triệu/tháng. Là gen Z, tôi khá "sành" về công nghệ nhưng lại "mù tịt" về tài chính. Tôi thường xuyên mua sắm online, đi du lịch và không có ý thức tiết kiệm. Bạn bè cùng tuổi cũng sống tương tự nên tôi nghĩ đó là bình thường. Khi bắt đầu sử dụng PlanAI, tôi mới sốc khi biết mình đã "đốt" hết 90% thu nhập vào những thứ không cần thiết. AI đã tạo cho tôi một kế hoạch "hạ cánh mềm" - không cắt giảm quá mạnh mà điều chỉnh từ từ. Tôi bắt đầu với việc đặt giới hạn cho shopping, chọn những chuyến du lịch tiết kiệm, và quan trọng nhất là bắt đầu đầu tư 2 triệu/tháng vào chứng khoán. Sau 9 tháng, tôi đã có 22 triệu tiết kiệm và danh mục đầu tư đang tăng trưởng tốt. Tôi cảm thấy trưởng thành hơn nhiều về mặt tài chính.',
    achievement: 'Từ tiêu 90% lương thành tiết kiệm 22 triệu trong 9 tháng',
    avatar: '👩‍💻'
  },
  {
    name: 'Quốc Bảo',
    age: 42,
    profession: 'Quản lý cửa hàng',
    story: 'Ở tuổi 42, tôi bắt đầu lo lắng về việc nghỉ hưu. Thu nhập 35 triệu/tháng từ việc quản lý chuỗi cửa hàng điện thoại, nhưng tôi chưa có kế hoạch cụ thể cho tuổi già. Con đã lớn, vợ cũng có công việc ổn định, nhưng tôi không biết liệu số tiền hiện tại có đủ cho 20-30 năm nghỉ hưu không. PlanAI đã mở mắt tôi về khái niệm "lập kế hoạch nghỉ hưu". AI tính toán rằng với lạm phát và chi phí y tế tăng cao, tôi cần ít nhất 8-10 tỷ để nghỉ hưu thoải mái. Nghe con số này tôi hơi sốc, nhưng AI đã lập kế hoạch chi tiết để đạt được mục tiêu này. Tôi bắt đầu đầu tư mạnh hơn vào bất động sản, trái phiếu chính phủ và một phần vào chứng khoán. Sau 12 tháng thực hiện kế hoạch, tài sản của tôi đã tăng từ 1.2 tỷ lên 1.6 tỷ. Tôi tin rằng với kế hoạch này, tôi sẽ có một tuổi già an nhàn.',
    achievement: 'Tăng tài sản từ 1.2 tỷ lên 1.6 tỷ trong 1 năm',
    avatar: '👨‍💼'
  },
  {
    name: 'Phương Linh',
    age: 31,
    profession: 'Kiến trúc sư',
    story: 'Là kiến trúc sư freelance, thu nhập của tôi rất bấp bênh. Có dự án thì kiếm được 40-50 triệu/tháng, không có thì chỉ 5-10 triệu. Tôi luôn sống trong lo lắng về tài chính và không dám nghĩ đến việc mua nhà hay lập gia đình. PlanAI đã giúp tôi hiểu cách quản lý dòng tiền không đều. AI tư vấn tôi tạo một "quỹ cân bằng" - những tháng kiếm nhiều sẽ để dành cho những tháng ít việc. Tôi cũng học được cách đa dạng hóa thu nhập bằng cách dạy học online và bán mẫu thiết kế. Sau 11 tháng áp dụng kế hoạch, tôi đã có thu nhập ổn định hơn với trung bình 28 triệu/tháng và quỹ dự phòng 4 tháng. Quan trọng hơn, tôi đã tự tin đủ để lên kế hoạch mua nhà và chuẩn bị kết hôn.',
    achievement: 'Ổn định thu nhập 28 triệu/tháng và có quỹ dự phòng 4 tháng',
    avatar: '👩‍🎨'
  },
  {
    name: 'Văn Đức',
    age: 39,
    profession: 'Chủ cửa hàng tạp hóa',
    story: 'Mình mở cửa hàng tạp hóa được 8 năm, kinh doanh ổn định với lợi nhuận khoảng 20 triệu/tháng. Nhưng mình chỉ biết để tiền trong ngân hàng với lãi suất thấp, không hiểu gì về đầu tư. Khi sử dụng PlanAI, mình mới biết rằng với lạm phát, tiền để ngân hàng thực chất đang mất giá. AI đã tạo cho mình một kế hoạch đầu tư phù hợp với người bận rộn như mình: 50% vào quỹ ETF, 30% vào vàng SJC, 20% để dự phòng. Mình cũng học được cách mở rộng kinh doanh bằng cách thêm dịch vụ giao hàng và bán online. Sau 18 tháng, lợi nhuận cửa hàng tăng lên 35 triệu/tháng, portfolio đầu tư đã có 180 triệu và đang tăng trưởng đều đặn 12%/năm.',
    achievement: 'Tăng lợi nhuận kinh doanh 75% và bắt đầu đầu tư thành công',
    avatar: '👨‍💼'
  },
  {
    name: 'Thu Trang',
    age: 27,
    profession: 'Nhân viên HR',
    story: 'Mình làm HR với lương 16 triệu/tháng, sống một mình ở Hà Nội. Mặc dù không có áp lực nuôi gia đình nhưng mình lại tiêu xài khá thoải mái - ăn uống, mua sắm, du lịch. Cuối tháng thường không còn tiền và phải vay bạn bè. Khi dùng PlanAI, mình mới nhận ra mình đang sống "paycheck to paycheck" mà không hề có kế hoạch cho tương lai. AI đã giúp mình lập ngân sách chi tiết và tìm ra những khoản chi không cần thiết. Mình bắt đầu nấu ăn tại nhà nhiều hơn, chọn những hoạt động giải trí miễn phí, và quan trọng nhất là tự động chuyển 4 triệu/tháng vào tài khoản tiết kiệm ngay khi nhận lương. Sau 10 tháng, mình đã có 45 triệu tiết kiệm và bắt đầu đầu tư vào chứng khoán. Giờ mình cảm thấy an tâm hơn nhiều về tương lai.',
    achievement: 'Từ không tiết kiệm được đồng nào thành có 45 triệu sau 10 tháng',
    avatar: '👩‍💼'
  },
  {
    name: 'Minh Khôi',
    age: 35,
    profession: 'Kỹ sư phần mềm',
    story: 'Làm việc tại một công ty công nghệ với lương 45 triệu/tháng, mình tưởng mình đã "giàu" và không cần lo về tài chính. Mình hay mua những đồ công nghệ đắt tiền, ăn uống sang trọng và du lịch thường xuyên. Tuy nhiên, khi muốn mua nhà, mình mới phát hiện ra mình chỉ có 200 triệu tiết kiệm sau 5 năm đi làm. PlanAI đã phân tích chi tiêu của mình và tạo kế hoạch cụ thể: cắt giảm chi tiêu không cần thiết, phát triển kỹ năng freelance để tăng thu nhập thêm 15-20 triệu/tháng, và lập chiến lược tiết kiệm có mục tiêu. Mình bắt đầu làm thêm các dự án freelance và học thêm kỹ năng mới. Sau 11 tháng theo kế hoạch, mình đã tích lũy được 600 triệu và có kế hoạch rõ ràng để mua căn hộ 2.8 tỷ trong năm tới. Quan trọng hơn, mình đã có chiến lược tài chính bền vững.',
    achievement: 'Tích lũy được 600 triệu và có kế hoạch mua nhà rõ ràng trong 11 tháng',
    avatar: '👨‍💻'
  }
]

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-20">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-6">
              Use Cases
            </h1>
            <p className="text-xl bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent max-w-3xl mx-auto mb-8 text-center">
              Khám phá cách PlanAI giúp các nhóm người dùng khác nhau đạt được<br />
              mục tiêu tài chính của họ
            </p>
          </div>

          {/* Use Cases Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {useCases.map((useCase) => {
              const IconComponent = useCase.icon
              return (
                <Link
                  key={useCase.id}
                  href={`/use-cases/${useCase.id}`}
                  className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 hover:shadow-xl bg-white border border-gray-200 hover:border-primary-300 group`}
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-primary-100 transition-colors">
                      <IconComponent className="w-6 h-6 text-gray-600 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-primary-500 transition-all">
                    {useCase.title}
                  </h3>
                  
                  <p className="text-sm mb-4 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                    {useCase.subtitle}
                  </p>
                  
                  <p className="text-sm leading-relaxed text-gray-700 mb-4">
                    {useCase.description}
                  </p>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Thu nhập:</span> {useCase.stats.income}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Mục tiêu:</span> {useCase.stats.goal}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Thời gian:</span> {useCase.stats.timeline}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Kỹ năng:</span> {useCase.stats.skills}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Kinh nghiệm:</span> {useCase.stats.experience}
                    </div>
                  </div>


                  <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold">
                    Xem chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Success Stories */}
          <div className="bg-gray-50 py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Câu chuyện thành công
                </h2>
                <p className="text-xl bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent max-w-3xl mx-auto">
                  Những câu chuyện thực tế về cách kế hoạch tài chính chi tiết giúp phát triển sự nghiệp, mua tài sản và kinh doanh thành công
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {successStories.map((story, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 flex items-center justify-center text-xl">
                        {story.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{story.name}</h4>
                        <p className="text-sm bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">{story.profession}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      "{story.story}"
                    </p>
                    
                    <div className="bg-primary-50 rounded-lg p-3">
                      <p className="text-primary-700 font-semibold text-sm">
                        🎯 {story.achievement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  PlanAI hoạt động như thế nào?
                </h2>
                <p className="text-xl bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent max-w-3xl mx-auto">
                  Quy trình 4 bước đơn giản để có kế hoạch tài chính cá nhân hóa
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    step: '01',
                    title: 'Chia sẻ thông tin',
                    description: 'Cung cấp thông tin về thu nhập, mục tiêu và tình hình tài chính hiện tại',
                    icon: '💬'
                  },
                  {
                    step: '02', 
                    title: 'AI phân tích',
                    description: 'Trí tuệ nhân tạo phân tích dữ liệu và tạo kế hoạch tài chính phù hợp',
                    icon: '🤖'
                  },
                  {
                    step: '03',
                    title: 'Nhận kế hoạch',
                    description: 'Nhận kế hoạch chi tiết 5,000-20,000 từ với lộ trình cụ thể từng bước',
                    icon: '📋'
                  },
                  {
                    step: '04',
                    title: 'Thực hiện & theo dõi',
                    description: 'Áp dụng kế hoạch và chat với AI để điều chỉnh khi cần thiết',
                    icon: '🎯'
                  }
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto">
                      {item.icon}
                    </div>
                    <div className="text-primary-600 font-bold text-sm mb-2">BƯỚC {item.step}</div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-16">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Bạn muốn có kế hoạch cho riêng mình?
              </h2>
              <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                Hãy bắt đầu hành trình đến tự do tài chính với kế hoạch cá nhân hóa từ PlanAI
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/start" className="bg-white text-primary-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors inline-flex items-center">
                  Bắt đầu miễn phí
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link href="/pricing" className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-primary-600 transition-colors">
                  Xem gói dịch vụ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
