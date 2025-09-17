'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Zap } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const u = await getCurrentUser()
      setUser(u)
    }
    fetchUser()
  }, [])

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">PlanAI</span>
            </Link>
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
              <Link href="/account" className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:bg-primary-700 transition-colors">
                {user.email.charAt(0).toUpperCase()}
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link href="/start" className="btn-primary">
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
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
                <Link href="/account" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                  Tài khoản
                </Link>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 text-gray-600 hover:text-primary-600">
                    Login
                  </Link>
                  <Link href="/start" className="block px-3 py-2 btn-primary text-center">
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
