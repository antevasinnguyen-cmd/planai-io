import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Các đường dẫn cần bảo vệ (yêu cầu đăng nhập)
  const protectedPaths = ['/dashboard', '/account', '/plans', '/settings']
  
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
  )
  
  // Nếu người dùng chưa đăng nhập và đang truy cập đường dẫn được bảo vệ
  if (!session && isProtectedPath) {
    console.log('Middleware: Chuyển hướng đến login vì chưa đăng nhập')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Nếu người dùng đã đăng nhập và đang truy cập trang đăng nhập/đăng ký
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    console.log('Middleware: Đã đăng nhập, chuyển hướng đến dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
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
