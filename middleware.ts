import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Các đường dẫn cần bảo vệ (yêu cầu đăng nhập)
  const protectedPaths = [
    '/dashboard',
    '/account',
    '/plans',
    '/settings',
  ]
  
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
  )
  
  // Nếu người dùng chưa đăng nhập và đang truy cập đường dẫn được bảo vệ
  if (!session && isProtectedPath) {
    // Lưu đường dẫn hiện tại để chuyển hướng sau khi đăng nhập
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Nếu người dùng đã đăng nhập và đang truy cập trang đăng nhập/đăng ký
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    // Chuyển hướng đến dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Xử lý callback từ OAuth (Google)
  if (req.nextUrl.pathname === '/dashboard' && req.nextUrl.hash && req.nextUrl.hash.includes('access_token')) {
    // Cho phép tiếp tục để AuthContext xử lý
    return res
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
