import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Tạo response mới để sửa đổi
  const res = NextResponse.next()
  
  // Tạo Supabase client với request và response
  const supabase = createMiddlewareClient({ req, res })
  
  // Log thông tin request
  console.log('=== MIDDLEWARE-NEW: Request ===', {
    url: req.nextUrl.pathname,
    method: req.method,
    timestamp: new Date().toISOString()
  })
  
  // Lấy thông tin phiên
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Log thông tin phiên
  console.log('=== MIDDLEWARE-NEW: Session ===', {
    hasSession: !!session,
    userEmail: session?.user?.email,
    error: error?.message
  })
  
  // Các đường dẫn cần bảo vệ (yêu cầu đăng nhập)
  const protectedPaths = ['/dashboard', '/account', '/plans', '/settings', '/ai']
  
  // Kiểm tra xem đường dẫn hiện tại có cần bảo vệ không
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`)
  )
  
  // Log thông tin kiểm tra đường dẫn
  console.log('=== MIDDLEWARE-NEW: Path check ===', {
    isProtectedPath,
    pathname: req.nextUrl.pathname
  })
  
  // Nếu người dùng chưa đăng nhập và đang truy cập đường dẫn được bảo vệ
  if (!session && isProtectedPath) {
    console.log('=== MIDDLEWARE-NEW: Chưa đăng nhập, chuyển hướng đến login ===')
    
    // Tạo URL chuyển hướng với tham số redirectUrl
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectUrl', req.nextUrl.pathname)
    
    return NextResponse.redirect(redirectUrl)
  }
  
  // Nếu người dùng đã đăng nhập và đang truy cập trang đăng nhập/đăng ký
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    console.log('=== MIDDLEWARE-NEW: Đã đăng nhập, chuyển hướng đến dashboard ===')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  // Trả về response đã được sửa đổi
  return res
}

// Cấu hình matcher để chỉ áp dụng middleware cho các đường dẫn cần thiết
export const config = {
  matcher: [
    // Áp dụng cho tất cả các đường dẫn trừ các đường dẫn tĩnh
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
