import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Clock, User, ArrowRight, Lock } from 'lucide-react'
import { blogPosts } from '@/lib/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog PlanAI - Kiến thức tài chính, đầu tư, tăng thu nhập',
  description:
    'Blog PlanAI chia sẻ kiến thức tài chính cá nhân, đầu tư, kiếm tiền online, tăng thu nhập và lập kế hoạch 1-3-5 năm. Nội dung thực tế, cập nhật, dành cho người trẻ tại Việt Nam.',
  openGraph: {
    title: 'Blog PlanAI - Kiến thức tài chính, đầu tư, tăng thu nhập',
    description:
      'Blog PlanAI chia sẻ kiến thức tài chính cá nhân, đầu tư, kiếm tiền online, tăng thu nhập và lập kế hoạch 1-3-5 năm.',
    type: 'website',
    url: 'https://planai.io/blog',
    siteName: 'PlanAI',
    locale: 'vi_VN',
  },
}

export default function BlogPage({
  searchParams,
}: {
  searchParams?: { page?: string }
}) {
  const featuredPosts = blogPosts.filter((post) => post.featured).slice(0, 2)
  const allPosts = blogPosts.filter((p) => !p.premium)
  const premiumPosts = blogPosts.filter((p) => p.premium)
  const pageSize = 6
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(allPosts.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const start = (page - 1) * pageSize
  const paginatedPosts = allPosts.slice(start, start + pageSize)

  const coverFor = (id: string, explicit?: string) => {
    if (explicit && !explicit.endsWith('/cover-default.svg')) return explicit
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
    const idx = (h % 24) + 1
    return `/blog/covers/cover-${idx}.svg`
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Blog <span className="gradient-text">PlanAI</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá những bài viết kiến thức về tài chính cá nhân, lập kế hoạch hiệu quả, tăng thu nhập,… từ đội ngũ chuyên gia PlanAI.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts (6 items) */}
      {featuredPosts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Bài Viết Nổi Bật
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <article key={post.id} className="group cursor-pointer" itemScope itemType="https://schema.org/BlogPosting">
                  <Link href={`/blog/${post.id}`}>
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="aspect-video relative">
                        <Image
                          src={coverFor(post.id, post.image)}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors" itemProp="headline">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3" itemProp="description">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span itemProp="author">{post.author}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Premium Posts inside Blog */}
      {premiumPosts.length > 0 && (
        <section className="pt-2 pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Bài Viết Trả Phí</h2>
              <Link href="/blog/premium" className="text-primary-600 hover:text-primary-700 inline-flex items-center">
                Xem tất cả
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {premiumPosts.slice(0, 6).map((post) => (
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
      )}

      {/* All Posts */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Tất Cả Bài Viết
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPosts.map((post) => (
              <article key={post.id} className="group cursor-pointer" itemScope itemType="https://schema.org/BlogPosting">
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
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2" itemProp="headline">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2" itemProp="description">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span itemProp="author">{post.author}</span>
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex items-center justify-center gap-2">
            <Link
              href={`/blog?page=${Math.max(1, page - 1)}`}
              className={`px-4 py-2 rounded-lg border ${page === 1 ? 'pointer-events-none opacity-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700'}`}
              aria-disabled={page === 1}
            >
              Trước
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/blog?page=${p}`}
                className={`px-4 py-2 rounded-lg border ${p === page ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={`/blog?page=${Math.min(totalPages, page + 1)}`}
              className={`px-4 py-2 rounded-lg border ${page === totalPages ? 'pointer-events-none opacity-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700'}`}
              aria-disabled={page === totalPages}
            >
              Sau
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sẵn sàng tạo kế hoạch tài chính của riêng bạn?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Sử dụng AI để tạo ra kế hoạch tài chính cá nhân hóa chỉ trong vài phút
          </p>
          <Link href="/start" className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Bắt đầu miễn phí
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* JSON-LD for Blog Index */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Blog PlanAI',
            description:
              'Kiến thức tài chính cá nhân, đầu tư, tăng thu nhập và lập kế hoạch thông minh với AI cho người trẻ Việt Nam.',
            url: 'https://planai.io/blog',
            inLanguage: 'vi-VN',
            blogPost: blogPosts.slice(0, 25).map((p) => ({
              '@type': 'BlogPosting',
              headline: p.title,
              articleSection: p.category,
              author: { '@type': 'Person', name: p.author },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `https://planai.io/blog/${p.id}`,
              },
            })),
          }),
        }}
      />

      <Footer />
    </main>
  )
}
