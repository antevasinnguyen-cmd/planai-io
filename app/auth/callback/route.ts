import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    console.log('=== ROUTE HANDLER: Callback received ===', {
      hasCode: !!code,
      error,
      errorDescription,
      url: request.url,
      timestamp: new Date().toISOString()
    })

    // Nếu có lỗi từ Google
    if (error) {
      console.error('=== ROUTE HANDLER: OAuth error ===', { error, errorDescription })
      return NextResponse.redirect(
        new URL(`/login?error=${error}&error_description=${encodeURIComponent(errorDescription || '')}`, requestUrl.origin)
      )
    }

    // Nếu có code, trao đổi thành session
    if (code) {
      const supabase = createRouteHandlerClient({ cookies })

      console.log('=== ROUTE HANDLER: Exchanging code for session ===')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('=== ROUTE HANDLER: Exchange error ===', {
          error: exchangeError.message,
          status: exchangeError.status,
          code
        })
        return NextResponse.redirect(
          new URL(`/login?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        )
      }

      if (data?.session) {
        console.log('=== ROUTE HANDLER: Session created successfully ===', {
          userId: data.session.user?.id,
          email: data.session.user?.email,
          timestamp: new Date().toISOString()
        })

        // CRITICAL: Ensure profile exists (fallback if trigger failed)
        try {
          const userId = data.session.user?.id
          const userEmail = data.session.user?.email
          
          if (userId && userEmail) {
            // Try to create profile if it doesn't exist
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                email: userEmail,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              })
            
            if (profileError) {
              console.warn('=== ROUTE HANDLER: Profile upsert warning ===', {
                userId,
                error: profileError.message
              })
              // Don't fail - continue anyway
            } else {
              console.log('=== ROUTE HANDLER: Profile ensured ===', { userId })
            }
          }
        } catch (profileErr) {
          console.warn('=== ROUTE HANDLER: Profile ensure failed ===', profileErr)
          // Don't fail - continue anyway
        }

        // Lưu thông báo thành công
        const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
        
        // Thêm header để client biết đăng nhập thành công
        response.headers.set('X-Auth-Success', 'true')
        
        return response
      } else {
        console.error('=== ROUTE HANDLER: No session in response ===', { data })
        return NextResponse.redirect(
          new URL('/login?error=no_session_in_response', requestUrl.origin)
        )
      }
    }

    // Nếu không có code cũng không có error
    console.warn('=== ROUTE HANDLER: No code and no error ===')
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
  } catch (error) {
    console.error('=== ROUTE HANDLER: Unexpected error ===', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/login?error=callback_error&message=${encodeURIComponent(errorMessage)}`, new URL(request.url).origin)
    )
  }
}
