import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Clock, User, ArrowLeft, ArrowRight, Share2 } from 'lucide-react'
import { blogPosts } from '@/lib/blog'
import fs from 'fs'
import path from 'path'
import Image from 'next/image'
import PremiumGate from '@/components/PremiumGate'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts.find(p => p.id === params.slug)
  
  if (!post) return notFound()

  const coverFor = (id: string, explicit?: string) => {
    if (explicit && !explicit.endsWith('/cover-default.svg')) return explicit
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
    const idx = (h % 24) + 1
    return `/blog/covers/cover-${idx}.svg`
  }

  // Get related posts (same category, excluding current post)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 2)

  // Try to load long-form markdown from local content if available
  let mdContent: string | null = null
  try {
    const mdPath = path.join(process.cwd(), 'content', 'blog', `${post.id}.md`)
    if (fs.existsSync(mdPath)) {
      mdContent = fs.readFileSync(mdPath, 'utf8')
    }
  } catch (e) {
    // ignore read errors, fallback to inline content
  }

  // Lightweight markdown to HTML conversion with consistent spacing
  const toHtml = (markdown: string) => {
    // Basic escape
    let escaped = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Headings and emphasis
    escaped = escaped
      .replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-semibold text-gray-900">$1<\/h3>')
      .replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold text-gray-900">$1<\/h2>')
      .replace(/^#\s+(.*)$/gm, '<h1 class="text-3xl font-bold text-gray-900">$1<\/h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')
      .replace(/\*(.*?)\*/g, '<em>$1<\/em>')

    // Convert list items
    let withLis = escaped.replace(/^(?:[-\*])\s+(.+)$/gm, '<li>$1<\/li>')
    // Bold question-like list items (ending with '?')
    withLis = withLis.replace(/<li>([^<]*?\?)\s*<\/li>/g, '<li><strong>$1<\/strong><\/li>')
    // Group consecutive <li> into <ul> (global)
    withLis = withLis.replace(/(?:^|\n)((?:<li>.*<\/li>\n?){2,})/g, (_m, g1) => `<ul class="list-disc list-inside my-4 space-y-2">${g1.replace(/\n+/g, '')}<\/ul>`) 

    // Horizontal rules
    withLis = withLis.replace(/(^|\n)---(\n|$)/g, '<hr class="my-8 border-gray-300" \/>')

    // Split into blocks by blank lines and wrap non-block elements in <p>
    const blocks = withLis.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)
    const html = blocks
      .map(b => (b.startsWith('<ul') || b.startsWith('<h') || b.startsWith('<hr')) ? b : `<p>${b}<\/p>`)
      .join('')

    return html
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* Article Header */}
      <article className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Blog */}
          <Link href="/blog" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Blog
          </Link>

          {/* Category Badge */}
          <div className="mb-4">
            <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>{post.readTime}</span>
            </div>
            <button className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors">
              <Share2 className="w-5 h-5" />
              <span>Chia sẻ</span>
            </button>
          </div>

          {/* Cover Image */}
          <div className="aspect-video rounded-2xl mb-12 relative overflow-hidden">
            <Image
              src={coverFor(post.id, post.image)}
              alt={post.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>

          {/* Article Content */}
          {post.premium ? (
            <PremiumGate slug={post.id} title={post.title} />
          ) : (
            <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:mt-8 prose-headings:mb-3 prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-hr:my-10 prose-img:my-6">
              <div
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: toHtml(mdContent ?? post.content) }}
              />
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 p-8 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Sẵn sàng áp dụng những kiến thức này?
            </h3>
            <p className="text-gray-600 mb-6">
              Tạo kế hoạch tài chính cá nhân hóa với AI chỉ trong vài phút
            </p>
            <Link href="/start" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
              Bắt đầu với PlanAI
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </article>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            author: {
              '@type': 'Person',
              name: post.author,
            },
            articleSection: post.category,
            inLanguage: 'vi-VN',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://planai.io/blog/${post.id}`,
            },
          }),
        }}
      />

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Bài Viết Liên Quan
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {relatedPosts.map((relatedPost) => (
                <article key={relatedPost.id} className="group cursor-pointer">
                  <Link href={`/blog/${relatedPost.id}`}>
                    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="aspect-video relative">
                        <Image
                          src={coverFor(relatedPost.id, relatedPost.image)}
                          alt={relatedPost.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            {relatedPost.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span>{relatedPost.author}</span>
                          </div>
                          <span>{relatedPost.readTime}</span>
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

      <Footer />
    </main>
  )
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.id,
  }))
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = blogPosts.find(p => p.id === params.slug)
  
  if (!post) {
    return {
      title: 'Bài viết không tìm thấy - PlanAI Blog',
    }
  }

  return {
    title: `${post.title} - PlanAI Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      authors: [post.author],
    },
  }
}
