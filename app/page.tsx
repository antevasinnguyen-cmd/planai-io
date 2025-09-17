import Hero from '@/components/Hero'
import Features from '@/components/Features'
import ChatDemo from '@/components/ChatDemo'
import Technology from '@/components/Technology'
import Stats from '@/components/Stats'
import PlanDemo from '@/components/PlanDemo'
import Testimonials from '@/components/Testimonials'
import HowItWorks from '@/components/HowItWorks'
import FAQ from '@/components/FAQ'
import CTA from '@/components/CTA'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* 1. Giới thiệu/Slogan + minh hoạ khung chat AI */}
      <Hero />
      
      {/* 2. CTA */}
      <CTA />
      
      {/* 3. Tính năng AI: Khung chat */}
      <Features />
      
      {/* 4. Khung chat + nút bắt đầu miễn phí */}
      <ChatDemo />
      
      {/* 5. Công nghệ được áp dụng (GPT-5 / Grok / Claude Opus / Supabase) */}
      <Technology />
      
      {/* 6. Con số người dùng đã sử dụng ứng dụng (5000+ user); số plan được tạo: 58.000+ */}
      <Stats />
      
      {/* 7. Công nghệ được áp dụng */}
      {/* Đã có ở section 5 */}
      
      {/* 8. Demo 1 plan chi tiết */}
      <PlanDemo />
      
      {/* 9. Quote */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <blockquote className="text-2xl md:text-3xl font-light text-white italic">
            "Biến dữ liệu thô thành bản kế hoạch đáng mơ ước"
          </blockquote>
          <cite className="block mt-6 text-primary-200 font-medium">
            - PlanAI Team
          </cite>
        </div>
      </section>
      
      {/* 10. Trusted by the community (người dùng nói gì) */}
      <Testimonials />
      
      {/* 11. Hướng dẫn sử dụng */}
      <HowItWorks />
      
      {/* 12. FAQ */}
      <FAQ />
      
      <Footer />
    </main>
  )
}
