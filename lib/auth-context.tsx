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
    // Tự động refresh session khi tab quay lại
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          console.log('=== AUTHCONTEXT: Tab quay lại, kiểm tra session ===')
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('=== AUTHCONTEXT: Lỗi khi lấy session (tạm thời) ===', error.message)
            // Lỗi tạm thời (network, Supabase down) - không redirect
            // User vẫn có thể tiếp tục sử dụng, session sẽ được kiểm tra lại lần sau
            return
          }
          
          if (session) {
            console.log('=== AUTHCONTEXT: Session vẫn còn, cập nhật ===')
            setSession(session);
            setUser(session.user);
          } else {
            // Session null có thể là:
            // 1. Session thực sự expired
            // 2. User chưa đăng nhập
            // 3. Lỗi tạm thời
            // Chỉ redirect nếu user đã đăng nhập trước đó (session state không null)
            if (session === null && user !== null) {
              console.warn('=== AUTHCONTEXT: Session đã hết hạn (user trước đó có session) ===')
              setUser(null);
              setSession(null);
              if (typeof window !== 'undefined') {
                window.location.href = '/login?expired=1';
              }
            } else {
              console.log('=== AUTHCONTEXT: Không có session (user chưa đăng nhập hoặc lỗi tạm thời) ===')
              // Không redirect - để user tiếp tục
            }
          }
        } catch (e) {
          console.error('=== AUTHCONTEXT: Lỗi khi kiểm tra session ===', e)
          // Lỗi tạm thời - không redirect, chỉ log
          // Để user tiếp tục sử dụng, session sẽ được kiểm tra lại lần sau
        }
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

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

        // CRITICAL FIX: Không redirect từ AuthContext nếu email xác thực
        // Middleware sẽ xử lý redirect logic
        // AuthContext chỉ quản lý state, không redirect
        if (session && !isEmailVerified(session.user)) {
          console.log('=== AUTHCONTEXT: Email chưa xác thực, giữ nguyên tại trang hiện tại ===')
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

          // CRITICAL FIX: Không redirect từ AuthContext
          // Middleware sẽ xử lý redirect logic
          // AuthContext chỉ cập nhật state
          if (!isEmailVerified(session.user)) {
            console.log('=== AUTHCONTEXT: SIGNED_IN - Email chưa xác thực ===')
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
