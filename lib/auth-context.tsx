'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isEmailVerified = (user: User | null | undefined) => {
  if (!user) return false
  const metadata = user.user_metadata || {}
  return Boolean(
    user.email_confirmed_at ||
    (user as any).confirmed_at ||
    metadata.email_verified ||
    metadata.emailConfirmed ||
    metadata.emailConfirmedAt
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    console.log('=== AUTHCONTEXT: Khởi tạo ===')

    // Lấy phiên hiện tại
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('=== AUTHCONTEXT: Phiên ban đầu ===', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          isEmailVerified: session ? isEmailVerified(session.user) : false,
          error: error?.message,
          timestamp: new Date().toISOString()
        })

        // CRITICAL FIX: Luôn set session (dù email chưa xác thực)
        // Để dashboard có thể kiểm tra session.user.email thay vì chỉ user
        setSession(session)
        setUser(session?.user ?? null)

        if (session && !isEmailVerified(session.user)) {
          console.log('=== AUTHCONTEXT: Phiên chưa xác thực email, user sẽ ở trang auth ===')
        }

        // Kiểm tra xem có cần chuyển hướng không
        // Chỉ redirect nếu email ĐÃ xác thực
        if (session && isEmailVerified(session.user) && typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          // Chỉ redirect từ /login hoặc /signup, KHÔNG redirect từ trang chủ
          if (currentPath === '/login' || currentPath === '/signup') {
            console.log('=== AUTHCONTEXT: Đã đăng nhập và xác thực email, chuyển hướng từ', currentPath, '===')
            
            // Kiểm tra redirect parameter từ URL hoặc localStorage
            let redirectPath = null
            
            // Ưu tiên redirect từ URL hiện tại
            const urlParams = new URLSearchParams(window.location.search)
            redirectPath = urlParams.get('redirect')
            
            // Nếu không có trong URL, kiểm tra localStorage
            if (!redirectPath) {
              redirectPath = localStorage.getItem('auth_redirect')
              if (redirectPath) {
                console.log('=== AUTHCONTEXT: Sử dụng đường dẫn từ localStorage ===', redirectPath)
                localStorage.removeItem('auth_redirect') // Xóa sau khi sử dụng
              }
            }
            
            if (redirectPath && redirectPath.startsWith('/') && !redirectPath.includes('//')) {
              console.log('=== AUTHCONTEXT: Chuyển hướng đến đường dẫn được chỉ định:', redirectPath)
              window.location.replace(redirectPath)
            } else {
              window.location.replace('/dashboard')
            }
          }
        }
      } catch (error) {
        console.error('=== AUTHCONTEXT: Lỗi khi lấy phiên ===', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Lắng nghe các thay đổi xác thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTHCONTEXT: Thay đổi trạng thái auth ===', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          isEmailVerified: session ? isEmailVerified(session.user) : false,
          currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          timestamp: new Date().toISOString()
        })

        // CRITICAL FIX: Luôn set session (dù email chưa xác thực)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Xử lý các thay đổi trạng thái xác thực
        if (event === 'SIGNED_IN' && session) {
          console.log('=== AUTHCONTEXT: SIGNED_IN event ===', session.user.email)

          // Lưu thông báo thành công và email người dùng
          localStorage.setItem('auth_success', 'true')
          localStorage.setItem('auth_user_email', session.user.email || '')

          // Chỉ chuyển hướng từ /login hoặc /signup, KHÔNG từ trang chủ
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            // Chỉ redirect từ login/signup pages nếu email ĐÃ xác thực
            if ((currentPath === '/login' || currentPath === '/signup') && isEmailVerified(session.user)) {
              console.log('=== AUTHCONTEXT: SIGNED_IN - Email xác thực, chuyển hướng từ', currentPath, '===')
              
              // Kiểm tra redirect parameter từ URL hoặc localStorage
              let redirectPath = null
              
              // Ưu tiên redirect từ URL hiện tại
              const urlParams = new URLSearchParams(window.location.search)
              redirectPath = urlParams.get('redirect')
              
              // Nếu không có trong URL, kiểm tra localStorage
              if (!redirectPath) {
                redirectPath = localStorage.getItem('auth_redirect')
                if (redirectPath) {
                  console.log('=== AUTHCONTEXT: Sử dụng đường dẫn từ localStorage ===', redirectPath)
                  localStorage.removeItem('auth_redirect') // Xóa sau khi sử dụng
                }
              }
              
              if (redirectPath && redirectPath.startsWith('/') && !redirectPath.includes('//')) {
                console.log('=== AUTHCONTEXT: Chuyển hướng đến đường dẫn được chỉ định:', redirectPath)
                window.location.replace(redirectPath)
              } else {
                window.location.replace('/dashboard')
              }
            } else if (!isEmailVerified(session.user)) {
              console.log('=== AUTHCONTEXT: SIGNED_IN - Email chưa xác thực, giữ nguyên tại trang hiện tại ===')
              // Không xóa auth_success, để user có thể thấy popup xác thực email
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('=== AUTHCONTEXT: SIGNED_OUT event ===')
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('=== AUTHCONTEXT: TOKEN_REFRESHED event ===')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      console.log('=== AUTHCONTEXT: Đăng xuất ===')
      
      // Xóa dữ liệu chat của người dùng hiện tại khi đăng xuất
      if (user?.id && typeof window !== 'undefined') {
        // Xóa các dữ liệu cụ thể của người dùng
        const userId = user.id
        localStorage.removeItem(`planai_chat_messages_${userId}`)
        localStorage.removeItem(`pending_plan_${userId}`)
        console.log(`=== AUTHCONTEXT: Đã xóa dữ liệu của user ${userId} ===`)
      }
      
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('=== AUTHCONTEXT: Lỗi khi đăng xuất ===', error)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('=== AUTHCONTEXT: Lỗi khi làm mới phiên ===', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider')
  }
  return context
}
