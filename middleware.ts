import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Tạo response mặc định
  const res = NextResponse.next()
  
  // Khởi tạo Supabase client
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Lấy session hiện tại
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('=== MIDDLEWARE: Session check ===', {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      userEmail: session?.user?.email,
      error: error?.message
    })

    // CRITICAL: Không redirect từ middleware
    // Để AuthContext (client-side) xử lý redirect logic
    // Middleware chỉ refresh session cookies
    
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
