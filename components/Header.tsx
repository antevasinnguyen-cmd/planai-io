// This is a temporary file to fix the header issue
// Please copy the content below to replace the existing Header.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import Logo from './Logo'

export default function Header() {
  const [user, setUser] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const avatarButtonRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target) && 
          avatarButtonRef.current && !avatarButtonRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
                  className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    {getUserInitial()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showUserMenu && (
                  <div 
                    ref={userMenuRef}
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
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
                      onClick={handleSignOut}
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
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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
          <div className="md:hidden">
            <div className="px-4 py-4 space-y-3">
              <Link href="/pricing" className="block py-3 px-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="/use-cases" className="block py-3 px-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                Use Cases
              </Link>
              <Link href="/blog" className="block py-3 px-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                Blog
              </Link>
              <Link href="/about" className="block py-3 px-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
              
              {user ? (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                      {getUserInitial()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block py-2 px-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/account"
                    className="block py-2 px-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-left py-2 px-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
                  <Link
                    href="/login"
                    className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full text-center py-2 px-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dùng thử miễn phí
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
