import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  console.log('=== MIDDLEWARE ===', {
    url: req.nextUrl.pathname,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Get the session
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log('=== MIDDLEWARE: Session ===', {
    hasSession: !!session,
    userEmail: session?.user?.email,
    error
  })

  // Các đường dẫn cần bảo vệ (yêu cầu đăng nhập)
  const protectedPaths = ['/dashboard', '/account', '/plans', '/settings']

  const isProtectedPath = protectedPaths.some(path =>
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
  )

  console.log('=== MIDDLEWARE: Path check ===', {
    isProtectedPath,
    pathname: req.nextUrl.pathname
  })

  // Nếu người dùng chưa đăng nhập và đang truy cập đường dẫn được bảo vệ
  if (!session && isProtectedPath) {
    console.log('=== MIDDLEWARE: Chưa đăng nhập, chuyển hướng login ===')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Nếu người dùng đã đăng nhập và đang truy cập trang đăng nhập/đăng ký
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    console.log('=== MIDDLEWARE: Đã đăng nhập, chuyển hướng dashboard ===')
    return NextResponse.redirect(new URL('/dashboard/simple', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
