import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

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
    
    // Sử dụng client từ auth-helpers để Supabase tự quản lý PKCE qua cookie
    const browserSupabase = createClientComponentClient()

    const { data, error } = await browserSupabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/auth/callback`,
        flowType: 'pkce'
      }
    })
    
    if (error) {
      console.error('=== SUPABASE: Lỗi đăng nhập Google ===', error)
    } else if (data?.url) {
      console.log('=== SUPABASE: Chuyển hướng người dùng tới Google OAuth ===', data.url)
      window.location.href = data.url
      return { data, error: null }
    } else {
      console.warn('=== SUPABASE: Không nhận được URL chuyển hướng từ Supabase ===')
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
        
        // Log all cookies for debugging
        console.log('=== SUPABASE: Checking cookies ===')
        const allCookies = cookieStore.getAll()
        console.log('=== SUPABASE: Available cookies:', allCookies.map(c => c.name))
        
        // Supabase cookie naming: sb-{project-ref}-auth-token
        // Project ref: wjzmscsoiibzlxejqpgg
        const projectRef = 'wjzmscsoiibzlxejqpgg'
        const accessToken = 
          cookieStore.get(`sb-${projectRef}-auth-token`)?.value ||
          cookieStore.get(`sb-${projectRef}-auth-token.0`)?.value ||
          cookieStore.get(`sb-${projectRef}-auth-token.1`)?.value ||
          cookieStore.get('sb-access-token')?.value || 
          cookieStore.get('supabase-auth-token')?.value ||
          // Try to find any sb-*-auth-token cookie
          allCookies.find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))?.value
        
        console.log('=== SUPABASE: Access token found:', !!accessToken)
        
        if (accessToken) {
          const { data: { user }, error } = await supabase.auth.getUser(accessToken)
          if (user && !error) {
            console.log('=== SUPABASE: User found from cookies ===', { userId: user.id })
            return user
          } else {
            console.log('=== SUPABASE: Token validation failed ===', error)
          }
        }
      } catch (cookieError) {
        console.log('=== SUPABASE: Cookie access failed ===', cookieError)
      }
    }
    
    // In API routes, we can't use getUser() without a token
    // If we reach here, authentication failed
    console.log('=== SUPABASE: No authentication method worked ===')
    console.log('=== SUPABASE: Authorization header:', request?.headers.get('Authorization') ? 'present' : 'missing')
    console.log('=== SUPABASE: Credentials include:', request ? 'API route' : 'client-side')
    
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
  return { data, error }
}

// Subscription and Usage helpers
export const getUserSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    
    // If no subscription found, return null (not error) - this is normal for new users
    if (error?.code === 'PGRST116') {
      console.log(`No subscription found for user ${userId}, using defaults`)
      return { data: null, error: null }
    }
    
    return { data, error }
  } catch (err) {
    console.error('Error getting subscription:', err)
    return { data: null, error: err }
  }
}

export const getSubscriptionLimits = (tier: string) => {
  // Default limits (fallback if database doesn't have subscription)
  const defaultLimits = {
    'free': { plans: 1, chats: 5, words: 1000 },
    'basic': { plans: 1, chats: 40, words: 6500 },
    'pro': { plans: 3, chats: 90, words: 10500 },
    'pro_max': { plans: 6, chats: 160, words: 17500 }
  }
  return defaultLimits[tier as keyof typeof defaultLimits] || defaultLimits.free
}

// Centralized tier display names
export const getTierName = (tier: string) => {
  switch (tier) {
    case 'free':
      return 'Free'
    case 'basic':
      return 'Gói 1'
    case 'pro':
      return 'Gói 2'
    case 'pro_max':
      return 'Gói 3'
    default:
      return 'Free'
  }
}

// Convenience wrapper to fetch both name and limits
export const getTierFeatures = (tier: string) => {
  return {
    name: getTierName(tier),
    limits: getSubscriptionLimits(tier)
  }
}

export const getServerCapsByTier = (tier: string) => {
  const caps = {
    free: { maxConcurrentJobs: 1 },
    basic: { maxConcurrentJobs: 1 },
    pro: { maxConcurrentJobs: 2 },
    pro_max: { maxConcurrentJobs: 3 }
  }
  return (caps as any)[tier] || caps.free
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

  // Count chat messages this month (user messages only, server-sourced to avoid duplicates)
  let chatsData: any[] | null = null
  let chatsError: any = null
  try {
    const res = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'user')
      .eq('source', 'api')
      .gte('created_at', startOfMonth.toISOString())
    chatsData = res.data as any[] | null
    chatsError = res.error
    // If column 'source' does not exist, fallback without it
    if (chatsError && String(chatsError.message || '').toLowerCase().includes('column') && String(chatsError.message || '').toLowerCase().includes('source')) {
      const resFallback = await supabase
        .from('chat_messages')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'user')
        .gte('created_at', startOfMonth.toISOString())
      chatsData = resFallback.data as any[] | null
      chatsError = resFallback.error
    }
  } catch (e) {
    chatsData = []
    chatsError = e
  }

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

  let tier = 'free'
  let limits = getSubscriptionLimits(tier) // Default limits

  // If subscription exists in database, use those limits
  if (subscription) {
    tier = subscription.tier
    // Use database limits if they exist, otherwise fallback to defaults
    limits = {
      plans: subscription.plan_limit || getSubscriptionLimits(tier).plans,
      chats: subscription.chat_limit || getSubscriptionLimits(tier).chats,
      words: subscription.word_limit || getSubscriptionLimits(tier).words
    }
  }

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

// Trial and Cache helpers (stub functions for compatibility)
export const initializeFreeTrialForNewUser = async (userId: string) => {
  try {
    // Check if user already has a subscription
    const { data: subscription } = await getUserSubscription(userId)
    if (subscription) {
      return { alreadyUsed: true, data: null }
    }
    
    // Create free trial subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: 'free',
        status: 'active',
        plan_limit: 1,
        chat_limit: 5,
        word_limit: 1000,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    return { alreadyUsed: false, data, error }
  } catch (error) {
    console.error('Error initializing free trial:', error)
    return { alreadyUsed: false, data: null, error }
  }
}

export const checkTrialStatus = async (userId: string) => {
  try {
    const { data: subscription } = await getUserSubscription(userId)
    if (!subscription) {
      return { hasActiveTrial: false, daysRemaining: 0 }
    }
    
    return { 
      hasActiveTrial: subscription.status === 'active',
      daysRemaining: 30 // Default 30 days
    }
  } catch (error) {
    console.error('Error checking trial status:', error)
    return { hasActiveTrial: false, daysRemaining: 0 }
  }
}

export const getCachedResponse = async (cacheKey: string) => {
  try {
    const { data, error } = await supabase
      .from('response_cache')
      .select('content')
      .eq('cache_key', cacheKey)
      .single()
    
    if (error?.code === 'PGRST116') {
      return { data: null, error: null }
    }
    
    return { data: data?.content || null, error }
  } catch (error) {
    return { data: null, error }
  }
}

export const saveCachedResponse = async (cacheKey: string, content: string, expiresInDays: number = 30) => {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    
    const { data, error } = await supabase
      .from('response_cache')
      .upsert({
        cache_key: cacheKey,
        content,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

