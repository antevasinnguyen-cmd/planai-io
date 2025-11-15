'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-new'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  showSuccessMessage: boolean
  setShowSuccessMessage: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    console.log('=== AUTHCONTEXT-NEW: Khởi tạo ===')

    // Xóa cache cũ nếu có
    const clearOldCache = () => {
      try {
        // Chỉ xóa các item liên quan đến auth
        const keysToRemove = ['auth_redirect', 'auth_callback_url']
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Kiểm tra thông báo thành công
        const hasAuthSuccess = localStorage.getItem('auth_success')
        if (hasAuthSuccess === 'true') {
          console.log('=== AUTHCONTEXT-NEW: Tìm thấy thông báo thành công ===')
          setShowSuccessMessage(true)
          // Không xóa auth_success ngay để tránh mất thông báo
        }
      } catch (error) {
        console.error('=== AUTHCONTEXT-NEW: Lỗi khi xóa cache ===', error)
      }
    }

    clearOldCache()

    // Lấy phiên hiện tại
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('=== AUTHCONTEXT-NEW: Phiên ban đầu ===', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          error
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Nếu có session và có thông báo thành công, hiển thị thông báo
        if (session && localStorage.getItem('auth_success') === 'true') {
          setShowSuccessMessage(true)
        }
      } catch (error) {
        console.error('=== AUTHCONTEXT-NEW: Lỗi khi lấy phiên ===', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Lắng nghe các thay đổi xác thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTHCONTEXT-NEW: Sự kiện thay đổi trạng thái auth ===', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email,
          currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
        })

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Xử lý các thay đổi trạng thái xác thực
        if (event === 'SIGNED_IN' && session) {
          console.log('=== AUTHCONTEXT-NEW: Sự kiện SIGNED_IN ===', session.user.email)

          // Lưu thông báo thành công
          localStorage.setItem('auth_success', 'true')
          setShowSuccessMessage(true)

          // Ưu tiên quay lại đường dẫn đã lưu (ví dụ: checkout)
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname
            const savedRedirect = localStorage.getItem('auth_redirect')
            const target = savedRedirect || '/dashboard'
            
            // Xóa redirect sau khi dùng để tránh vòng lặp
            if (savedRedirect) localStorage.removeItem('auth_redirect')
            
            // Tránh redirect nếu đã ở đúng trang
            if (currentPath !== target) {
              console.log('=== AUTHCONTEXT-NEW: Chuyển hướng sau đăng nhập ===', { target })
              setTimeout(() => {
                window.location.href = target
              }, 300)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('=== AUTHCONTEXT-NEW: Sự kiện SIGNED_OUT ===')
          
          // Xóa thông báo thành công
          localStorage.removeItem('auth_success')
          setShowSuccessMessage(false)
          
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('=== AUTHCONTEXT-NEW: Đăng xuất ===')
      
      // Xóa thông báo thành công
      localStorage.removeItem('auth_success')
      setShowSuccessMessage(false)
      
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('=== AUTHCONTEXT-NEW: Lỗi khi đăng xuất ===', error)
    }
  }

  const refreshSession = async () => {
    try {
      console.log('=== AUTHCONTEXT-NEW: Làm mới phiên ===')
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('=== AUTHCONTEXT-NEW: Lỗi khi làm mới phiên ===', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
    showSuccessMessage,
    setShowSuccessMessage
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
