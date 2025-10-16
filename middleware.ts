import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Tạo response mặc định
  const res = NextResponse.next()
  
  // Khởi tạo Supabase client
  const supabase = createMiddlewareClient({ req, res })
  const pathname = req.nextUrl.pathname

  try {
    // Chỉ refresh session, không redirect
    // Để auth-context xử lý redirect logic
    const { data: { session } } = await supabase.auth.getSession()

    if (pathname.startsWith('/blog/') && pathname.includes('-paid')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login?redirect=' + pathname, req.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', session.user.id)
        .single()

      const paidTiers = ['basic', 'pro', 'pro_max']
      if (!profile || !paidTiers.includes(profile.subscription_tier)) {
        return NextResponse.redirect(new URL('/pricing', req.url))
      }
    }

    // Trả về response để tiếp tục
    return res
  } catch (error) {
    console.error('=== MIDDLEWARE: Error ===', error)
    return res
  }
}

export const config = {
  matcher: [
    // Chỉ áp dụng middleware cho các đường dẫn không phải static assets
    '/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
