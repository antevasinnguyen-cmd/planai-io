'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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
          error: error?.message,
          timestamp: new Date().toISOString()
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Kiểm tra xem có cần chuyển hướng không
        if (session && typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          // Chỉ redirect từ /login hoặc /signup, KHÔNG redirect từ trang chủ
          if (currentPath === '/login' || currentPath === '/signup') {
            console.log('=== AUTHCONTEXT: Đã đăng nhập, chuyển hướng từ', currentPath, '===')
            window.location.replace('/dashboard')
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
          currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          timestamp: new Date().toISOString()
        })

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
            // Chỉ redirect từ login/signup pages
            if (currentPath === '/login' || currentPath === '/signup') {
              console.log('=== AUTHCONTEXT: SIGNED_IN - Chuyển hướng từ', currentPath, 'đến dashboard ===')
              window.location.replace('/dashboard')
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
