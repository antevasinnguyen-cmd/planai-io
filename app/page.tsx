'use client'

import { Suspense, lazy } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import CTA from '@/components/CTA'

// Preload critical above-the-fold components
import Features from '@/components/Features'

// Lazy load components with optimized loading
const ChatDemo = dynamic(() => import('@/components/ChatDemo'), {
  loading: () => <LoadingFallback />,
  ssr: false
})

const Technology = dynamic(() => import('@/components/Technology'), {
  loading: () => <LoadingFallback />
})

const Stats = dynamic(() => import('@/components/Stats'), {
  loading: () => <LoadingFallback />
})

const PlanDemo = dynamic(() => import('@/components/PlanDemo'), {
  loading: () => <LoadingFallback />
})

const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => <LoadingFallback />
})

const HowItWorks = dynamic(() => import('@/components/HowItWorks'), {
  loading: () => <LoadingFallback />
})

const FAQ = dynamic(() => import('@/components/FAQ'), {
  loading: () => <LoadingFallback />
})

// Optimized loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center py-8">
    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
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
