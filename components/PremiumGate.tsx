"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, CheckCircle2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Props = {
  slug: string
  title?: string
}

export default function PremiumGate({ slug, title }: Props) {
  const [status, setStatus] = useState<'loading' | 'locked' | 'unlocked' | 'error'>('loading')
  const [content, setContent] = useState<string>('')
  
  // Use createClientComponentClient for proper session handling in Next.js App Router
  const supabase = createClientComponentClient()

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('[PremiumGate] User check:', { user: user?.id, error: userError })
        if (!user) {
          console.log('[PremiumGate] No user, locking')
          setStatus('locked')
          return
        }
        // Try to fetch profile with maybeSingle() to handle missing profiles gracefully
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .maybeSingle()
        
        console.log('[PremiumGate] Profile check:', { tier: profile?.subscription_tier, error, hasProfile: !!profile })
        
        // If there's an error (e.g., RLS), try to fetch via API endpoint instead
        let tier = profile?.subscription_tier || 'free'
        if (error && !profile) {
          console.log('[PremiumGate] Profile query failed, trying API endpoint:', error)
          try {
            const tierRes = await fetch('/api/user/tier', { credentials: 'include' })
            if (tierRes.ok) {
              const tierData = await tierRes.json()
              tier = tierData.tier || 'free'
              console.log('[PremiumGate] Got tier from API:', { tier })
            } else {
              console.log('[PremiumGate] API endpoint also failed, assuming free tier')
              tier = 'free'
            }
          } catch (apiErr) {
            console.log('[PremiumGate] API fetch exception, assuming free tier:', apiErr)
            tier = 'free'
          }
        }
        
        const allowed = ['basic', 'pro'].includes(tier)
        console.log('[PremiumGate] Tier check:', { tier, allowed })
        if (!allowed) {
          console.log('[PremiumGate] Tier not allowed, locking')
          setStatus('locked')
          return
        }
        // Get session for auth header
        const { data: { session } } = await supabase.auth.getSession()
        const headers: any = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        console.log('[PremiumGate] Fetching content with auth:', { slug, hasAuth: !!session?.access_token })
        const res = await fetch(`/api/premium/${slug}`, { headers, credentials: 'include' })
        console.log('[PremiumGate] Fetch response:', { status: res.status, ok: res.ok })
        if (!res.ok) {
          console.log('[PremiumGate] Fetch failed, setting error status')
          setStatus('error')
          return
        }
        const text = await res.text()
        console.log('[PremiumGate] Content loaded, unlocking')
        setContent(text)
        setStatus('unlocked')
      } catch (e) {
        console.error('[PremiumGate] Error:', e)
        setStatus('error')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (status === 'loading') {
    return (
      <div className="p-10 rounded-2xl border border-gray-200 bg-white animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
      </div>
    )
  }

  if (status !== 'unlocked') {
    return (
      <div className="p-10 rounded-2xl border border-gray-200 bg-white text-center">
        <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Bài viết trả phí</h3>
        <p className="text-gray-600 mb-6">
          Nội dung này chỉ dành cho người dùng đã đăng ký gói trả phí của PlanAI (Gói 1 hoặc Gói 2).
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="px-5 py-3 rounded-xl bg-white border text-gray-700 hover:bg-gray-50">Đăng nhập</Link>
          <Link href="/pricing" className="px-5 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700">
            Mua gói để mở khoá
          </Link>
        </div>
        <div className="mt-6 text-left max-w-xl mx-auto text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-primary-600"/> <span>Mở khoá toàn bộ 15 bài viết trả phí</span></div>
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-primary-600"/> <span>Phân tích chuyên sâu, logic, có checklist thực thi</span></div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-600"/> <span>Cập nhật định kỳ theo dữ liệu thực</span></div>
        </div>
      </div>
    )
  }

  // Unlocked: render markdown with a light converter (match article spacing)
  const toHtml = (markdown: string) => {
    let escaped = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    escaped = escaped
      .replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-semibold text-gray-900">$1<\/h3>')
      .replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold text-gray-900">$1<\/h2>')
      .replace(/^#\s+(.*)$/gm, '<h1 class="text-3xl font-bold text-gray-900">$1<\/h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')
      .replace(/\*(.*?)\*/g, '<em>$1<\/em>')
    let withLis = escaped.replace(/^(?:[-\*])\s+(.+)$/gm, '<li>$1<\/li>')
    withLis = withLis.replace(/<li>([^<]*?\?)\s*<\/li>/g, '<li><strong>$1<\/strong><\/li>')
    withLis = withLis.replace(/(?:^|\n)((?:<li>.*<\/li>\n?){2,})/g, (_m, g1) => `<ul class="list-disc list-inside my-4 space-y-2">${g1.replace(/\n+/g, '')}<\/ul>`)
    withLis = withLis.replace(/(^|\n)---(\n|$)/g, '<hr class="my-8 border-gray-300" \/>')
    const blocks = withLis.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)
    const html = blocks.map(b => (b.startsWith('<ul') || b.startsWith('<h') || b.startsWith('<hr')) ? b : `<p>${b}<\/p>`).join('')
    return html
  }

  return (
    <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:mt-8 prose-headings:mb-3 prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-hr:my-10 prose-img:my-6">
      <div className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: toHtml(content) }} />
    </div>
  )
}
