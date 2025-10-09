'use client'

import { Suspense, lazy } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import CTA from '@/components/CTA'

// Lazy load heavy components
const Features = lazy(() => import('@/components/Features'))
const ChatDemo = lazy(() => import('@/components/ChatDemo'))
const Technology = lazy(() => import('@/components/Technology'))
const Stats = lazy(() => import('@/components/Stats'))
const PlanDemo = lazy(() => import('@/components/PlanDemo'))
const Testimonials = lazy(() => import('@/components/Testimonials'))
const HowItWorks = lazy(() => import('@/components/HowItWorks'))
const FAQ = lazy(() => import('@/components/FAQ'))

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center py-16">
    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* 1. Giới thiệu/Slogan + minh hoạ khung chat AI */}
      <Hero />
      
      {/* 2. CTA */}
      <CTA />
      
      {/* 3. Tính năng AI: Khung chat */}
      <Suspense fallback={<LoadingFallback />}>
        <Features />
      </Suspense>
      
      {/* 4. Khung chat + nút bắt đầu miễn phí */}
      <Suspense fallback={<LoadingFallback />}>
        <ChatDemo />
      </Suspense>
      
      {/* 5. Công nghệ được áp dụng (GPT-5 / Grok / Claude Opus / Supabase) */}
      <Suspense fallback={<LoadingFallback />}>
        <Technology />
      </Suspense>
      
      {/* 6. Con số người dùng đã sử dụng ứng dụng (5000+ user); số plan được tạo: 58.000+ */}
      <Suspense fallback={<LoadingFallback />}>
        <Stats />
      </Suspense>
      
      {/* 7. Công nghệ được áp dụng */}
      {/* Đã có ở section 5 */}
      
      {/* 8. Demo 1 plan chi tiết */}
      <Suspense fallback={<LoadingFallback />}>
        <PlanDemo />
      </Suspense>
      
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
      <Suspense fallback={<LoadingFallback />}>
        <Testimonials />
      </Suspense>
      
      {/* 11. Hướng dẫn sử dụng */}
      <Suspense fallback={<LoadingFallback />}>
        <HowItWorks />
      </Suspense>
      
      {/* 12. FAQ */}
      <Suspense fallback={<LoadingFallback />}>
        <FAQ />
      </Suspense>
      
      <Footer />
    </main>
  )
}
