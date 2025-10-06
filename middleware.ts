import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Tạo response mặc định
  const res = NextResponse.next()
  
  // Khởi tạo Supabase client
  const supabase = createMiddlewareClient({ req, res })

  // Log thông tin request
  console.log('=== MIDDLEWARE: Request ===', {
    url: req.nextUrl.pathname,
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers),
    cookies: Object.fromEntries(req.cookies)
  })

  try {
    // Lấy session hiện tại
    const { data: { session }, error } = await supabase.auth.getSession()

    // Log thông tin session
    console.log('=== MIDDLEWARE: Session ===', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      error: error?.message
    })

    // Các đường dẫn cần bảo vệ (yêu cầu đăng nhập)
    const protectedPaths = ['/dashboard', '/account', '/plans', '/settings']

    // Kiểm tra xem đường dẫn hiện tại có cần bảo vệ không
    const isProtectedPath = protectedPaths.some(path =>
      req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
    )

    console.log('=== MIDDLEWARE: Path check ===', {
      isProtectedPath,
      pathname: req.nextUrl.pathname
    })

    // Xử lý chuyển hướng
    if (!session && isProtectedPath) {
      // Người dùng chưa đăng nhập và đang truy cập đường dẫn được bảo vệ
      console.log('=== MIDDLEWARE: Chưa đăng nhập, chuyển hướng login ===')
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
      // Người dùng đã đăng nhập và đang truy cập trang đăng nhập/đăng ký
      console.log('=== MIDDLEWARE: Đã đăng nhập, chuyển hướng dashboard ===')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Trả về response mặc định nếu không có chuyển hướng
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
