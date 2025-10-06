import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Tạo client Supabase với cấu hình rõ ràng
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Sử dụng PKCE flow cho bảo mật tốt hơn
  }
})

// Hàm đăng ký
export const signUp = async (email: string, password: string, userData?: any) => {
  try {
    console.log('=== SUPABASE: Đăng ký với email ===', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('=== SUPABASE: Lỗi đăng ký ===', error)
    } else {
      console.log('=== SUPABASE: Đăng ký thành công ===', data)
    }
    
    return { data, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi đăng ký ===', err)
    return { data: null, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

// Hàm đăng nhập bằng email/password
export const signIn = async (email: string, password: string) => {
  try {
    console.log('=== SUPABASE: Đăng nhập với email ===', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('=== SUPABASE: Lỗi đăng nhập ===', error)
    } else {
      console.log('=== SUPABASE: Đăng nhập thành công ===', data)
      // Lưu thông báo thành công
      localStorage.setItem('auth_success', 'true')
    }
    
    return { data, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi đăng nhập ===', err)
    return { data: null, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

// Hàm đăng nhập với Google
export const signInWithGoogle = async () => {
  try {
    console.log('=== SUPABASE: Bắt đầu đăng nhập với Google ===')
    
    // Xóa localStorage trước để đảm bảo không có dữ liệu cũ
    localStorage.removeItem('auth_success')
    localStorage.removeItem('supabase.auth.token')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('=== SUPABASE: Lỗi đăng nhập Google ===', error)
    } else {
      console.log('=== SUPABASE: Đăng nhập Google đã khởi tạo ===', data)
    }
    
    return { data, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi đăng nhập Google ===', err)
    return { data: null, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

// Hàm đăng xuất
export const signOut = async () => {
  try {
    console.log('=== SUPABASE: Đăng xuất ===')
    
    // Xóa localStorage trước khi đăng xuất
    localStorage.removeItem('auth_success')
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('=== SUPABASE: Lỗi đăng xuất ===', error)
    } else {
      console.log('=== SUPABASE: Đăng xuất thành công ===')
    }
    
    return { error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi đăng xuất ===', err)
    return { error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async () => {
  try {
    console.log('=== SUPABASE: Lấy thông tin người dùng hiện tại ===')
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('=== SUPABASE: Lỗi lấy thông tin người dùng ===', error)
    } else {
      console.log('=== SUPABASE: Thông tin người dùng ===', user)
    }
    
    return { user, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi lấy thông tin người dùng ===', err)
    return { user: null, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

// Lấy phiên hiện tại
export const getSession = async () => {
  try {
    console.log('=== SUPABASE: Lấy phiên hiện tại ===')
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('=== SUPABASE: Lỗi lấy phiên ===', error)
    } else {
      console.log('=== SUPABASE: Thông tin phiên ===', {
        hasSession: !!data.session,
        userEmail: data.session?.user?.email
      })
    }
    
    return { data, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi lấy phiên ===', err)
    return { data: { session: null }, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

// Hàm làm mới phiên
export const refreshSession = async () => {
  try {
    console.log('=== SUPABASE: Làm mới phiên ===')
    
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('=== SUPABASE: Lỗi làm mới phiên ===', error)
    } else {
      console.log('=== SUPABASE: Làm mới phiên thành công ===', {
        hasSession: !!data.session,
        userEmail: data.session?.user?.email
      })
    }
    
    return { data, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi làm mới phiên ===', err)
    return { data: { session: null, user: null }, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

// Hàm kiểm tra và xử lý hash URL sau khi đăng nhập OAuth
export const handleAuthRedirect = async () => {
  try {
    if (typeof window === 'undefined') return { data: null, error: null }
    
    console.log('=== SUPABASE: Xử lý hash URL ===')
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('=== SUPABASE: Lỗi xử lý hash URL ===', error)
    } else if (data.session) {
      console.log('=== SUPABASE: Xử lý hash URL thành công ===', data.session.user.email)
      localStorage.setItem('auth_success', 'true')
    }
    
    return { data, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi xử lý hash URL ===', err)
    return { data: null, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}
