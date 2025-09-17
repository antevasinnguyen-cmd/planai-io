import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Shield, Brain, Target, MessageSquare, FileText, Sparkles, ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Về <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">PlanAI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chúng tôi giúp bạn biến mục tiêu tài chính thành kế hoạch hành động rõ ràng – nhanh chóng, cá nhân hóa và thực tế.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Sứ mệnh</h2>
              <p className="text-gray-700 leading-relaxed">
                PlanAI được tạo ra để giúp người Việt xây dựng tương lai tài chính vững chắc bằng cách biến dữ liệu rời rạc thành một kế hoạch
                hành động đầy đủ: từ chiến lược, lộ trình 1-3-5 năm, đến checklist từng tuần và nguồn tài liệu học tập đi kèm.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Thay vì phải mất hàng tháng tự mày mò, bạn nhận ngay một kế hoạch như một cuốn Ebook cá nhân hóa – rõ ràng, đo lường được và có thể thực thi.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-primary-600" />
                  <div>
                    <div className="font-semibold text-gray-900">AI tài chính am hiểu Việt Nam</div>
                    <div className="text-sm text-gray-600">Phân tích theo bối cảnh thu nhập, chi tiêu, thị trường trong nước</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-primary-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Kế hoạch như một cuốn Ebook</div>
                    <div className="text-sm text-gray-600">5.000–20.000 từ với lộ trình, KPI, SOP, checklist rõ ràng</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-6 h-6 text-primary-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Chat tương tác 2 chiều</div>
                    <div className="text-sm text-gray-600">AI hỏi thêm để hiểu bạn và điều chỉnh kế hoạch liên tục</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Bảo mật & đáng tin cậy</div>
                    <div className="text-sm text-gray-600">Hạ tầng bảo mật hiện đại với Supabase và chuẩn mã hóa</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">Giá trị cốt lõi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <Target className="w-6 h-6 text-primary-600 mb-3" />
              <div className="font-semibold text-gray-900 mb-1">Tập trung vào kết quả</div>
              <div className="text-sm text-gray-600">Kế hoạch có KPI, mốc thời gian, chi tiết thực thi – không chỉ là lý thuyết.</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <Sparkles className="w-6 h-6 text-primary-600 mb-3" />
              <div className="font-semibold text-gray-900 mb-1">Cá nhân hóa 100%</div>
              <div className="text-sm text-gray-600">Mỗi người một kế hoạch khác nhau – phù hợp thu nhập, mục tiêu và hoàn cảnh.</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <Heart className="w-6 h-6 text-primary-600 mb-3" />
              <div className="font-semibold text-gray-900 mb-1">Đồng hành dài hạn</div>
              <div className="text-sm text-gray-600">AI theo sát tiến độ và gợi ý điều chỉnh theo từng giai đoạn phát triển.</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works short */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">PlanAI hoạt động thế nào?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Chia sẻ thông tin', desc: 'Mục tiêu, thời gian, thu nhập, bối cảnh' },
              { step: '02', title: 'AI phân tích', desc: 'Tạo chiến lược, lộ trình, KPI, ngân sách' },
              { step: '03', title: 'Nhận kế hoạch', desc: 'Ebook cá nhân hóa 5.000–20.000 từ' },
              { step: '04', title: 'Thực thi & tối ưu', desc: 'Chat để điều chỉnh theo thực tế' },
            ].map((item, idx) => (
              <div key={idx} className="text-center bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-sm font-bold text-primary-600">BƯỚC {item.step}</div>
                <div className="mt-2 font-semibold text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-600 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-primary-100 mb-8">Tạo kế hoạch đầu tiên miễn phí chỉ trong vài phút</p>
          <Link href="/start" className="inline-flex items-center bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors">
            Bắt đầu miễn phí
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
