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
          error
        })
        setSession(session)
        setUser(session?.user ?? null)
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
          currentPath: window.location.pathname
        })

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Xử lý các thay đổi trạng thái xác thực
        if (event === 'SIGNED_IN' && session) {
          console.log('=== AUTHCONTEXT: SIGNED_IN event ===', session.user.email)

          // Lưu thông báo thành công
          localStorage.setItem('auth_success', 'true')

          // Chuyển hướng đến dashboard nếu không phải đang ở dashboard
          const currentPath = window.location.pathname
          if (currentPath !== '/dashboard' && !currentPath.startsWith('/dashboard/')) {
            console.log('=== AUTHCONTEXT: Redirecting to dashboard ===')
            window.location.replace('/dashboard/simple')
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('=== AUTHCONTEXT: SIGNED_OUT event ===')
          window.location.href = '/'
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
