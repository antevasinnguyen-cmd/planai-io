"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  CreditCard, ArrowRight, User, Settings, LogOut, Trash2, FileText,
  Home, Target, BarChart3, Calendar, Sun, Moon, Crown, Menu, X, ChevronDown,
  HelpCircle, Lock, Save, Eye, EyeOff, AlertCircle, Check
} from 'lucide-react'
import { 
  getUserProfile, supabase, getUserSubscription, getUserUsageStats, 
  getSubscriptionLimits, updateUserProfile, changePassword, 
  resetPasswordRequest, verifyOtpAndResetPassword 
} from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import Logo from '@/components/Logo'
import type { UserProfile } from '@/types'

export default function AccountPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [storageOption, setStorageOption] = useState('30days')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [usageStats, setUsageStats] = useState<any>(null)
  const { user, loading: authLoading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  
  // Form states
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Forgot password states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('')
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('')
  const [forgotPasswordConfirm, setForgotPasswordConfirm] = useState('')
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [forgotPasswordError, setForgotPasswordError] = useState('')
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [isForgotPasswordProcessing, setIsForgotPasswordProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      const run = async () => {
        const { data: p } = await getUserProfile(user.id)
        if (p) {
          setProfile(p as unknown as UserProfile)
          setFullName(p.full_name || '')
          setDateOfBirth(p.date_of_birth || '')
          setForgotPasswordEmail(user.email || '')
        }

        const { data: sub } = await getUserSubscription(user.id)
        setSubscription(sub)

        const stats = await getUserUsageStats(user.id)
        setUsageStats(stats)

        setIsLoading(false)
      }
      run()
    }
  }, [router, user, authLoading])

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  }

  const getUserInitial = () => {
    const name = getUserName()
    return name.charAt(0).toUpperCase()
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    
    try {
      const { error } = await updateUserProfile(user.id, {
        full_name: fullName,
        date_of_birth: dateOfBirth
      })
      
      if (error) {
        setSaveError('Có lỗi xảy ra khi lưu thông tin: ' + error.message)
      } else {
        setSaveSuccess(true)
        // Cập nhật profile state
        if (profile) {
          setProfile({
            ...profile,
            full_name: fullName,
            date_of_birth: dateOfBirth
          })
        }
        
        // Hiển thị thông báo thành công trong 3 giây
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)
      }
    } catch (err) {
      setSaveError('Có lỗi xảy ra khi lưu thông tin')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleChangePassword = async () => {
    // Reset states
    setPasswordError('')
    setPasswordSuccess(false)
    
    // Validate
    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    
    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới không khớp')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      const { data, error } = await changePassword(currentPassword, newPassword)
      
      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess(true)
        // Reset form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        // Đóng modal sau 2 giây
        setTimeout(() => {
          setShowPasswordModal(false)
          setPasswordSuccess(false)
        }, 2000)
      }
    } catch (err) {
      setPasswordError('Có lỗi xảy ra khi thay đổi mật khẩu')
      console.error(err)
    } finally {
      setIsChangingPassword(false)
    }
  }
  
  const handleForgotPassword = async () => {
    setForgotPasswordError('')
    
    if (forgotPasswordStep === 1) {
      // Validate email
      if (!forgotPasswordEmail) {
        setForgotPasswordError('Vui lòng nhập email')
        return
      }
      
      setIsForgotPasswordProcessing(true)
      
      try {
        const { error } = await resetPasswordRequest(forgotPasswordEmail)
        
        if (error) {
          setForgotPasswordError(error.message)
        } else {
          // Chuyển sang bước nhập OTP
          setForgotPasswordStep(2)
        }
      } catch (err) {
        setForgotPasswordError('Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu')
        console.error(err)
      } finally {
        setIsForgotPasswordProcessing(false)
      }
    } else if (forgotPasswordStep === 2) {
      // Validate OTP
      if (!forgotPasswordOtp) {
        setForgotPasswordError('Vui lòng nhập mã OTP')
        return
      }
      
      // Chuyển sang bước nhập mật khẩu mới
      setForgotPasswordStep(3)
    } else if (forgotPasswordStep === 3) {
      // Validate mật khẩu mới
      if (!forgotPasswordNewPassword) {
        setForgotPasswordError('Vui lòng nhập mật khẩu mới')
        return
      }
      
      if (forgotPasswordNewPassword !== forgotPasswordConfirm) {
        setForgotPasswordError('Mật khẩu mới không khớp')
        return
      }
      
      if (forgotPasswordNewPassword.length < 6) {
        setForgotPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
        return
      }
      
      setIsForgotPasswordProcessing(true)
      
      try {
        const { error } = await verifyOtpAndResetPassword(
          forgotPasswordEmail,
          forgotPasswordOtp,
          forgotPasswordNewPassword
        )
        
        if (error) {
          setForgotPasswordError(error.message)
        } else {
          setForgotPasswordSuccess(true)
          
          // Đóng modal sau 2 giây
          setTimeout(() => {
            setShowForgotPasswordModal(false)
            setForgotPasswordStep(1)
            setForgotPasswordOtp('')
            setForgotPasswordNewPassword('')
            setForgotPasswordConfirm('')
            setForgotPasswordSuccess(false)
          }, 2000)
        }
      } catch (err) {
        setForgotPasswordError('Có lỗi xảy ra khi đặt lại mật khẩu')
        console.error(err)
      } finally {
        setIsForgotPasswordProcessing(false)
      }
    }
  }
  
  const handleDeleteAccount = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      await signOut()
      router.push('/')
    }
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free Plan'
      case 'basic': return 'Gói 1'
      case 'pro': return 'Gói 2 - Pro'
      case 'pro_max': return 'Gói 3 - Pro Max'
      default: return 'Free Plan'
    }
  }

  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-white flex">
      {/* Modal thay đổi mật khẩu */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-primary-600" />
              Thay đổi mật khẩu
            </h3>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 dark:text-red-400 text-sm">{passwordError}</span>
              </div>
            )}
            
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700 dark:text-green-400 text-sm">Mật khẩu đã được thay đổi thành công!</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Xác nhận mật khẩu mới"
                />
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mr-2"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal quên mật khẩu */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-primary-600" />
              {forgotPasswordStep === 1 && "Quên mật khẩu"}
              {forgotPasswordStep === 2 && "Nhập mã OTP"}
              {forgotPasswordStep === 3 && "Tạo mật khẩu mới"}
            </h3>
            
            {forgotPasswordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 dark:text-red-400 text-sm">{forgotPasswordError}</span>
              </div>
            )}
            
            {forgotPasswordSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700 dark:text-green-400 text-sm">Mật khẩu đã được đặt lại thành công!</span>
              </div>
            )}
            
            <div className="space-y-4">
              {forgotPasswordStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nhập email của bạn"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Chúng tôi sẽ gửi mã OTP đến email của bạn để xác thực.
                  </p>
                </div>
              )}
              
              {forgotPasswordStep === 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mã OTP
                  </label>
                  <input
                    type="text"
                    value={forgotPasswordOtp}
                    onChange={(e) => setForgotPasswordOtp(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nhập mã OTP"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Vui lòng kiểm tra email của bạn và nhập mã OTP đã được gửi.
                  </p>
                </div>
              )}
              
              {forgotPasswordStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={forgotPasswordNewPassword}
                      onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={forgotPasswordConfirm}
                      onChange={(e) => setForgotPasswordConfirm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Xác nhận mật khẩu mới"
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (forgotPasswordStep > 1) {
                      setForgotPasswordStep(forgotPasswordStep - 1)
                    } else {
                      setShowForgotPasswordModal(false)
                    }
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mr-2"
                >
                  {forgotPasswordStep > 1 ? "Quay lại" : "Hủy"}
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isForgotPasswordProcessing}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isForgotPasswordProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    forgotPasswordStep === 3 ? "Xác nhận" : "Tiếp tục"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col fixed h-screen z-20`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          {sidebarOpen ? (
            <>
              <Logo href="/dashboard" size="md" showText={true} isDashboard={true} />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </>
          ) : (
            <>
              <Logo href="/dashboard" size="md" showText={false} isDashboard={true} />
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded mx-auto mt-2"
              >
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Main Section */}
          <div className="mb-0 pb-1">
            {sidebarOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Chính</p>
            )}
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <Home className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Tổng quan</span>}
              </Link>
              <Link
                href="/dashboard/create-plan"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <Target className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Tạo Plan</span>}
              </Link>
              <Link
                href="/dashboard/plans"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Kế hoạch</span>}
              </Link>
              <Link
                href="/dashboard/calendar"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                {sidebarOpen && <span className="text-sm font-medium">Lịch trình</span>}
              </Link>
            </div>
          </div>

          {/* Customization Section */}
          {sidebarOpen && (
            <div className="px-4 pb-4 space-y-1 border-t border-gray-200 dark:border-gray-800 pt-2 -mt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Tuỳ chỉnh</p>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  {theme === 'light' ? (
                    <Sun className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {theme === 'light' ? 'Sáng' : 'Tối'}
                  </span>
                </div>
                <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                  <div className={`absolute top-1 ${theme === 'dark' ? 'right-1' : 'left-1'} w-4 h-4 bg-white dark:bg-primary-500 rounded-full transition-all`} />
                </div>
              </button>

              {/* Quản trị gói */}
              <Link
                href="/dashboard/subscription"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              >
                <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
                <span className="text-sm font-medium">Quản trị gói</span>
              </Link>

              {/* Upgrade Button */}
              <Link
                href="/pricing"
                className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
              >
                <Crown className="w-4 h-4" />
                <span>Nâng cấp gói</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Plan Status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{getTierName(tier)}</p>
              </div>
              
              {/* Chat Usage */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Tin nhắn</span>
                  <span className="font-medium">{usageStats?.chats || 0}/{limits.chats}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usageStats?.chats || 0) / limits.chats) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Plans Usage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Kế hoạch</span>
                  <span className="font-medium">{usageStats?.plans || 0}/{limits.plans}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usageStats?.plans || 0) / limits.plans) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Bar */}
        <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quản lý thông tin cá nhân và cài đặt</p>
            </div>

            {/* Right: User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
              >
                <span className="text-sm font-medium hidden sm:block">{getUserName()}</span>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                  {getUserInitial()}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl py-2 z-50">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Home className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Trang chủ</span>
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Cài đặt</span>
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">Trợ giúp</span>
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Account Information */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                Thông tin tài khoản
              </h2>
              
              {/* Thông báo thành công/lỗi */}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700 dark:text-green-400 text-sm">Thông tin đã được lưu thành công!</span>
                </div>
              )}
              
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700 dark:text-red-400 text-sm">{saveError}</span>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ngày tháng năm sinh
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mật khẩu
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 flex items-center"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Thay đổi mật khẩu
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thông tin
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Gói hiện tại</p>
                    <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-1">
                      {getTierName(tier)}
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Nâng cấp
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                Thống kê sử dụng
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat với AI</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {usageStats?.chats || 0} / {limits.chats}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(((usageStats?.chats || 0) / limits.chats) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kế hoạch đã tạo</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {usageStats?.plans || 0} / {limits.plans}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(((usageStats?.plans || 0) / limits.plans) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Từ đã sử dụng</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {usageStats?.words || 0} / {limits.words}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-purple-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(((usageStats?.words || 0) / limits.words) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary-600" />
                Cài đặt lưu trữ
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="storage"
                    value="30days"
                    checked={storageOption === '30days'}
                    onChange={(e) => setStorageOption(e.target.value)}
                    className="mr-3 w-4 h-4 text-primary-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Lưu trữ theo gói đăng ký (30 ngày)</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dữ liệu sẽ được lưu trữ trong 30 ngày</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="radio"
                    name="storage"
                    value="7days"
                    checked={storageOption === '7days'}
                    onChange={(e) => setStorageOption(e.target.value)}
                    className="mr-3 w-4 h-4 text-primary-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Xóa sau mỗi 7 ngày</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dữ liệu sẽ tự động xóa sau 7 ngày</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-red-200 dark:border-red-900 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5 mr-2" />
                Vùng nguy hiểm
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. Không thể hoàn tác.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa tài khoản
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
