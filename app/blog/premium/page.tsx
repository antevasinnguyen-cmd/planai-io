import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Lock, ArrowRight } from 'lucide-react'
import { blogPosts } from '@/lib/blog'

export const metadata = {
  title: 'Bài viết trả phí - PlanAI',
  description: 'Chuyên mục bài viết trả phí với phân tích chuyên sâu, cấu trúc logic, và checklist triển khai thực tế dành cho người dùng trả phí PlanAI.',
}

const coverFor = (id: string, explicit?: string) => {
  if (explicit && !explicit.endsWith('/cover-default.svg')) return explicit
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const idx = (h % 24) + 1
  return `/blog/covers/cover-${idx}.svg`
}

export default function PremiumIndexPage() {
  const premiumPosts = blogPosts.filter((p) => p.premium)

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-24 pb-12 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Bài Viết Trả Phí</h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Nội dung chuyên sâu, logic và có checklist thực thi — mở khoá tự động khi bạn mua gói PlanAI.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {premiumPosts.map((post) => (
              <article key={post.id} className="group cursor-pointer">
                <Link href={`/blog/${post.id}`}>
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="aspect-video relative">
                      <Image
                        src={coverFor(post.id, post.image)}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 text-gray-900 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Trả phí
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{post.readTime}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/pricing" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">
              Mua gói để mở khoá toàn bộ bài viết
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
