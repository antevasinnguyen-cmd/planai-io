'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from './Logo'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const avatarButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const u = await getCurrentUser()
      setUser(u)
    }
    fetchUser()
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the avatar button
      if (avatarButtonRef.current && avatarButtonRef.current.contains(event.target as Node)) {
        return
      }
      
      // Close if clicking outside the menu
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    await signOut()
    setUser(null)
    setShowUserMenu(false)
    router.push('/')
  }

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 overflow-x-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Logo */}
          <div className="flex items-center">
            <Logo href="/" size="md" showText={true} />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/pricing" className="text-gray-600 hover:text-primary-600 transition-colors">
              Pricing
            </Link>
            <Link href="/use-cases" className="text-gray-600 hover:text-primary-600 transition-colors">
              Use Cases
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-primary-600 transition-colors">
              Blog
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-primary-600 transition-colors">
              About
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative z-50">
                <button
                  ref={avatarButtonRef}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    {getUserInitial()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showUserMenu && (
                  <div 
                    ref={userMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-2xl py-1 z-[9999] border border-gray-200 max-w-[90vw] overflow-x-hidden top-full"
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{user.user_metadata?.full_name || 'User'}</div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Tài khoản
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="btn-primary">
                  Bắt đầu miễn phí
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-primary-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed left-0 right-0 top-16 bg-white border-t border-gray-200 overflow-x-hidden max-h-[calc(100vh-64px)] overflow-y-auto z-40">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 w-full">
              <Link href="/pricing" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                Pricing
              </Link>
              <Link href="/use-cases" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                Use Cases
              </Link>
              <Link href="/blog" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                Blog
              </Link>
              <Link href="/about" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                About
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                    Dashboard
                  </Link>
                  <Link href="/account" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                    Tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                    Login
                  </Link>
                  <Link href="/signup" className="block px-3 py-2 btn-primary text-center">
                    Bắt đầu miễn phí
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
