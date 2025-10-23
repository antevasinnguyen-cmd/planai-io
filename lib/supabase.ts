import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = async (email: string, password: string, userData?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  try {
    console.log('=== SUPABASE: Bắt đầu đăng nhập với Google ===')
    console.log('Origin:', window.location.origin)
    console.log('Redirect URL:', `${window.location.origin}/auth/callback`)
    
    // Lưu đường dẫn chuyển hướng vào localStorage trước khi chuyển hướng
    const currentPath = window.location.pathname
    if (currentPath !== '/login' && currentPath !== '/signup') {
      localStorage.setItem('auth_redirect', currentPath)
    }
    
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
    
    // Kiểm tra kết quả
    if (error) {
      console.error('=== SUPABASE: Lỗi đăng nhập Google ===', error)
    } else if (data?.url) {
      console.log('=== SUPABASE: Đăng nhập thành công, chuyển hướng đến ===', data.url)
      
      // Chuyển hướng đến URL của Google
      window.location.href = data.url
      return { data, error: null }
    } else {
      console.log('=== SUPABASE: Không có URL chuyển hướng ===', data)
    }
    
    return { data, error }
  } catch (err) {
    console.error('=== SUPABASE: Lỗi không xác định khi đăng nhập Google ===', err)
    return { data: null, error: err instanceof Error ? err : new Error('Lỗi không xác định') }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async (request?: Request) => {
  try {
    // For API routes, try to get user from Authorization header or session
    if (request) {
      console.log('=== SUPABASE: Getting user from API request ===')
      
      // Try to get Authorization header
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (user && !error) {
          console.log('=== SUPABASE: User found from Authorization header ===', { userId: user.id })
          return user
        }
      }
      
      // Try to get user from cookies using next/headers
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = cookies()
        
        // Get access token from cookies
        const accessToken = cookieStore.get('sb-access-token')?.value || 
                           cookieStore.get('supabase-auth-token')?.value
        
        if (accessToken) {
          const { data: { user }, error } = await supabase.auth.getUser(accessToken)
          if (user && !error) {
            console.log('=== SUPABASE: User found from cookies ===', { userId: user.id })
            return user
          }
        }
      } catch (cookieError) {
        console.log('=== SUPABASE: Cookie access failed (expected in some contexts) ===', cookieError)
      }
    }
    
    // Fallback to regular supabase client
    console.log('=== SUPABASE: Fallback to regular supabase client ===')
    const { data: { user }, error } = await supabase.auth.getUser()
    if (user && !error) {
      console.log('=== SUPABASE: User found from regular client ===', { userId: user.id })
      return user
    }
    
    console.log('=== SUPABASE: No user found ===')
    return null
  } catch (error) {
    console.error('=== SUPABASE: Error getting current user ===', error)
    return null
  }
}

// Database helpers
export const createUserProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        ...profileData,
        created_at: new Date().toISOString()
      }
    ])
  return { data, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// Map AI analysis extracted info to profile columns and update
export const updateProfileFromAnalysis = async (userId: string, extractedInfo: any) => {
  if (!extractedInfo) return { data: null, error: null }
  const updates: any = {}
  if (extractedInfo.goal) updates.financial_goal = extractedInfo.goal
  if (typeof extractedInfo.income === 'number') updates.current_income = extractedInfo.income
  if (extractedInfo.timeline) updates.timeline = extractedInfo.timeline
  if (typeof extractedInfo.age === 'number') updates.age = extractedInfo.age
  if (extractedInfo.occupation) updates.occupation = extractedInfo.occupation
  if (extractedInfo.location) updates.location = extractedInfo.location

  if (Object.keys(updates).length === 0) return { data: null, error: null }
  return await updateUserProfile(userId, updates)
}

// Chat helpers
export const saveChatMessage = async (userId: string, message: string, type: 'user' | 'ai') => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        user_id: userId,
        message,
        type,
        created_at: new Date().toISOString()
      }
    ])
  return { data, error }
}

export const getChatHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return { data, error }
}

// Plan helpers
export const savePlan = async (userId: string, planData: any) => {
  const { data, error } = await supabase
    .from('plans')
    .insert([{
      user_id: userId,
      ...planData
    }])
    .select()
  
  return { data, error }
}

export const getPlanById = async (planId: string) => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()
  
  return { data, error }
}

export const updatePlan = async (planId: string, updates: any) => {
  const { data, error } = await supabase
    .from('plans')
    .update(updates)
    .eq('id', planId)
    .select()
  
  return { data, error }
}

export const getUserPlans = async (userId: string) => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Subscription and Usage helpers
export const getUserSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return { data, error }
}

// Free Trial helpers - 30 days trial, one-time only
export const initializeFreeTrialForNewUser = async (userId: string) => {
  // Check if user already had a free trial
  const { data: existingTrial } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('tier', 'free')
    .single()
  
  if (existingTrial) {
    // User already had free trial, don't create another one
    return { data: null, error: null, alreadyUsed: true }
  }
  
  // Create new 30-day free trial
  const trialStartDate = new Date()
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 30)
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{
      user_id: userId,
      tier: 'free',
      status: 'active',
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      created_at: new Date().toISOString()
    }])
    .select()
  
  return { data, error, alreadyUsed: false }
}

export const checkTrialStatus = async (userId: string) => {
  const { data: subscription } = await getUserSubscription(userId)
  
  if (!subscription || subscription.tier !== 'free') {
    return { isActive: false, daysRemaining: 0, expired: true }
  }
  
  const trialEndDate = new Date(subscription.trial_end_date)
  const now = new Date()
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysRemaining <= 0) {
    // Trial expired, update status
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', subscription.id)
    
    return { isActive: false, daysRemaining: 0, expired: true }
  }
  
  return { isActive: true, daysRemaining, expired: false }
}

export const getSubscriptionLimits = (tier: string) => {
  const limits = {
    'free': { plans: 1, chats: 5, words: 1000 },
    'basic': { plans: 1, chats: 40, words: 6500 }, // Average of 5000-8000
    'pro': { plans: 3, chats: 90, words: 10500 }, // Average of 9000-12000
    'pro_max': { plans: 6, chats: 160, words: 17500 } // Average of 15000-20000
  }
  return limits[tier as keyof typeof limits] || limits.free
}

export const getUserUsageStats = async (userId: string) => {
  // Get current month usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  // Count plans created this month
  const { data: plansData, error: plansError } = await supabase
    .from('plans')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
  
  // Count chat messages this month (user messages only)
  const { data: chatsData, error: chatsError } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'user')
    .gte('created_at', startOfMonth.toISOString())
  
  // Sum word count from plans this month
  const { data: wordsData, error: wordsError } = await supabase
    .from('plans')
    .select('word_count')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
  
  const totalWords = wordsData?.reduce((sum, plan) => sum + (plan.word_count || 0), 0) || 0
  
  return {
    plans: plansData?.length || 0,
    chats: chatsData?.length || 0,
    words: totalWords,
    error: plansError || chatsError || wordsError
  }
}

export const checkUsageLimits = async (userId: string, action: 'chat' | 'plan') => {
  // Get user subscription
  const { data: subscription } = await getUserSubscription(userId)
  const tier = subscription?.tier || 'free'
  const limits = getSubscriptionLimits(tier)
  
  // Get current usage
  const usage = await getUserUsageStats(userId)
  
  if (action === 'chat') {
    return {
      allowed: usage.chats < limits.chats,
      current: usage.chats,
      limit: limits.chats,
      tier
    }
  } else if (action === 'plan') {
    return {
      allowed: usage.plans < limits.plans,
      current: usage.plans,
      limit: limits.plans,
      tier
    }
  }
  
  return { allowed: false, current: 0, limit: 0, tier }
}

// AI Response Cache helpers
export const getCachedResponse = async (cacheKey: string) => {
  try {
    // Get current time for expiration check
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('ai_response_cache')
      .select('response, expires_at, created_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', now) // Only get non-expired cache entries
      .single()
    
    if (error || !data) {
      return { data: null, error }
    }
    
    // Log cache hit for analytics
    console.log(`Cache hit for key: ${cacheKey.substring(0, 20)}... (created ${new Date(data.created_at).toLocaleString()})`)
    
    return { data: data.response, error: null }
  } catch (error) {
    console.error('Cache retrieval error:', error)
    return { data: null, error }
  }
}

export const saveCachedResponse = async (cacheKey: string, response: string, expiresInDays = 7) => {
  try {
    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    
    // Check response size and compress if needed
    let processedResponse = response
    if (response.length > 100000) { // If response is very large
      // Simple compression by removing excessive whitespace
      processedResponse = response.replace(/\n\s*\n\s*\n/g, '\n\n')
      console.log(`Compressed cache response from ${response.length} to ${processedResponse.length} chars`)
    }
    
    const { data, error } = await supabase
      .from('ai_response_cache')
      .upsert([
        {
          cache_key: cacheKey,
          response: processedResponse,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          access_count: 1 // Initialize access count
        }
      ])
    
    if (error) {
      console.error('Cache save error:', error)
    } else {
      console.log(`Cached response with key: ${cacheKey.substring(0, 20)}... (expires in ${expiresInDays} days)`)
    }
    
    return { data, error }
  } catch (error) {
    console.error('Cache save error:', error)
    return { data: null, error }
  }
}

export const updateCacheAccessCount = async (cacheKey: string) => {
  try {
    // Increment the access count for analytics
    await supabase.rpc('increment_cache_access', { key: cacheKey })
  } catch (error) {
    console.warn('Failed to update cache access count:', error)
  }
}

export const deleteCachedResponse = async (cacheKey: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_response_cache')
      .delete()
      .eq('cache_key', cacheKey)
    
    if (!error) {
      console.log(`Deleted cache entry with key: ${cacheKey.substring(0, 20)}...`)
    }
    
    return { data, error }
  } catch (error) {
    console.error('Cache deletion error:', error)
    return { data: null, error }
  }
}

export const cleanupExpiredCache = async () => {
  try {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('ai_response_cache')
      .delete()
      .lt('expires_at', now)
    
    if (error) {
      console.error('Cache cleanup error:', error)
    } else if (data && Array.isArray(data)) {
      console.log(`Cleaned up ${data.length} expired cache entries`)
    } else {
      console.log('Cleaned up expired cache entries')
    }
    
    return { data, error }
  } catch (error) {
    console.error('Cache cleanup error:', error)
    return { data: null, error }
  }
}

// Password management functions
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    // Verify current password by attempting to sign in
    const { data: userData, error: signInError } = await supabase.auth.getSession()
    
    if (signInError) {
      return { data: null, error: signInError }
    }
    
    if (!userData?.session?.user?.email) {
      return { data: null, error: new Error('Không thể xác thực người dùng hiện tại') }
    }
    
    // Attempt to sign in with current password to verify it
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userData.session.user.email,
      password: currentPassword
    })
    
    if (verifyError) {
      return { data: null, error: new Error('Mật khẩu hiện tại không chính xác') }
    }
    
    // Update to new password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    return { data, error }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Lỗi không xác định khi thay đổi mật khẩu') }
  }
}

export const resetPasswordRequest = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    return { data, error }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Lỗi không xác định khi yêu cầu đặt lại mật khẩu') }
  }
}

export const verifyOtpAndResetPassword = async (email: string, otp: string, newPassword: string) => {
  try {
    // Verify OTP
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery'
    })
    
    if (verifyError) {
      return { data: null, error: verifyError }
    }
    
    // Update password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    return { data, error }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Lỗi không xác định khi đặt lại mật khẩu') }
  }
}

