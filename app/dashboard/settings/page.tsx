'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Trash2, Save, ArrowLeft, Shield, Bell, Database
} from 'lucide-react'
import { getUserProfile, updateUserProfile, supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [storageOption, setStorageOption] = useState('30days')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadProfile()
    }
  }, [user, authLoading, router])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      const { data } = await getUserProfile(user.id)
      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
        setStorageOption(data.storage_option || '30days')
        setEmailNotifications(data.email_notifications !== false)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      await updateUserProfile(user.id, {
        full_name: fullName,
        storage_option: storageOption,
        email_notifications: emailNotifications
      })
      
      setSuccessMessage('Đã lưu thay đổi thành công!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Có lỗi xảy ra khi lưu thông tin')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ Bạn có chắc chắn muốn xóa tài khoản?\n\nHành động này sẽ:\n- Xóa vĩnh viễn tất cả dữ liệu của bạn\n- Xóa tất cả kế hoạch đã tạo\n- Không thể hoàn tác\n\nNhập "XOA TAI KHOAN" để xác nhận.')) {
      return
    }

    const confirmation = prompt('Nhập "XOA TAI KHOAN" để xác nhận:')
    if (confirmation !== 'XOA TAI KHOAN') {
      alert('Xác nhận không đúng. Hủy xóa tài khoản.')
      return
    }

    try {
      // Delete user data
      await supabase.from('plans').delete().eq('user_id', user?.id)
      await supabase.from('chat_messages').delete().eq('user_id', user?.id)
      await supabase.from('subscriptions').delete().eq('user_id', user?.id)
      await supabase.from('profiles').delete().eq('id', user?.id)
      
      // Sign out and redirect
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Có lỗi xảy ra khi xóa tài khoản')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải cài đặt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cài đặt tài khoản</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Quản lý thông tin cá nhân và tùy chọn</p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}

        {/* Thông tin cá nhân */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Thông tin cá nhân</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email không thể thay đổi</p>
            </div>
          </div>
        </div>

        {/* Tùy chọn lưu trữ */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lưu trữ dữ liệu</h2>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="storage"
                value="30days"
                checked={storageOption === '30days'}
                onChange={(e) => setStorageOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Lưu trữ 30 ngày (Khuyến nghị)</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Kế hoạch của bạn sẽ được lưu trong 30 ngày</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="storage"
                value="7days"
                checked={storageOption === '7days'}
                onChange={(e) => setStorageOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Xóa sau 7 ngày</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tự động xóa kế hoạch sau 7 ngày để tiết kiệm dung lượng</p>
              </div>
            </label>
          </div>
        </div>

        {/* Thông báo */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Thông báo</h2>
          </div>
          
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Thông báo qua email</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nhận cập nhật về kế hoạch và tính năng mới</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200">Vùng nguy hiểm</h2>
          </div>
          
          <p className="text-sm text-red-800 dark:text-red-300 mb-4">
            Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu của bạn. Hành động này không thể hoàn tác.
          </p>
          
          <button
            onClick={handleDeleteAccount}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa tài khoản vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  )
}
