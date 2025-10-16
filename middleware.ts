import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Tạo response mặc định
  const res = NextResponse.next()
  
  // Khởi tạo Supabase client
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Chỉ refresh session, không redirect
    // Để auth-context xử lý redirect logic
    await supabase.auth.getSession()

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
