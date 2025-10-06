'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    // Lấy phiên hiện tại
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Lỗi khi lấy phiên:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Lắng nghe các thay đổi xác thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Trạng thái xác thực thay đổi:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Xử lý các thay đổi trạng thái xác thực
        if (event === 'SIGNED_IN' && session) {
          console.log('AuthContext: SIGNED_IN event, user:', session.user.email)
          
          // Lưu thông báo thành công
          localStorage.setItem('auth_success', 'true')
          
          // Nếu đang ở trang login/signup, chuyển hướng đến dashboard
          if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
            console.log('AuthContext: Chuyển hướng từ trang auth đến dashboard')
            window.location.replace('/dashboard')
          }
        } else if (event === 'SIGNED_OUT') {
          // Xử lý khi đăng xuất
          console.log('AuthContext: SIGNED_OUT event, chuyển về trang chủ')
          window.location.href = '/'
        }
      }
    )

    // Không cần xử lý hash ở đây nữa vì đã có trang callback riêng

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Lỗi khi làm mới phiên:', error)
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
