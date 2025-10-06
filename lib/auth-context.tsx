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
    console.log('=== AUTHCONTEXT: Initializing ===')

    // Lấy phiên hiện tại
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('=== AUTHCONTEXT: Initial session ===', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          error: error?.message,
          timestamp: new Date().toISOString()
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Kiểm tra xem có cần chuyển hướng không
        if (session && window.location.pathname === '/login') {
          console.log('=== AUTHCONTEXT: Already logged in, redirecting from login page ===')
          window.location.replace('/dashboard')
        }
      } catch (error) {
        console.error('=== AUTHCONTEXT: Error getting session ===', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Lắng nghe các thay đổi xác thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTHCONTEXT: Auth state change ===', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          currentPath: window.location.pathname,
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

          // Lấy đường dẫn chuyển hướng nếu có
          const redirectTo = localStorage.getItem('auth_redirect') || '/dashboard'
          localStorage.removeItem('auth_redirect')
          
          // Chuyển hướng đến dashboard hoặc đường dẫn được yêu cầu
          const currentPath = window.location.pathname
          if (currentPath !== redirectTo && 
              currentPath !== '/dashboard' && 
              !currentPath.startsWith('/dashboard/') &&
              currentPath !== '/auth/callback') {
            console.log(`=== AUTHCONTEXT: Redirecting to ${redirectTo} ===`)
            window.location.replace(redirectTo)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('=== AUTHCONTEXT: SIGNED_OUT event ===')
          window.location.href = '/'
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('=== AUTHCONTEXT: TOKEN_REFRESHED event ===')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      console.log('=== AUTHCONTEXT: Signing out ===')
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      window.location.href = '/'
    } catch (error) {
      console.error('=== AUTHCONTEXT: Error signing out ===', error)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('=== AUTHCONTEXT: Error refreshing session ===', error)
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
