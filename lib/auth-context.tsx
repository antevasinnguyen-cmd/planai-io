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
          console.log('AuthContext: SIGNED_IN event, user:', session.user.id)
          
          // Lưu thông báo thành công
          localStorage.setItem('auth_success', 'true')
          
          // Nếu đang ở trang callback, để trang callback xử lý chuyển hướng
          if (window.location.pathname !== '/auth/callback') {
            console.log('AuthContext: Không phải trang callback, xử lý chuyển hướng')
            
            // Nếu không phải trang callback, chuyển hướng đến dashboard
            const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard'
            localStorage.removeItem('auth_redirect') // Xóa sau khi sử dụng
            
            // Đảm bảo redirectPath không phải là 'null' hoặc 'undefined'
            const safePath = redirectPath && redirectPath !== 'null' && redirectPath !== 'undefined' 
              ? redirectPath 
              : '/dashboard'
            
            // Chỉ chuyển hướng nếu đang không ở trang đích
            if (window.location.pathname !== safePath) {
              console.log('AuthContext: Chuyển hướng đến', safePath)
              
              // Sử dụng setTimeout để đảm bảo các thay đổi được áp dụng trước khi chuyển hướng
              setTimeout(() => {
                window.location.href = safePath
              }, 100)
            }
          } else {
            console.log('AuthContext: Đang ở trang callback, để trang callback xử lý')
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
