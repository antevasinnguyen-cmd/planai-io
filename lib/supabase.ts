import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Admin client with service role key (bypasses RLS)
let adminClient: ReturnType<typeof createClient> | null = null

export const getAdminClient = () => {
  if (!supabaseServiceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
    return null
  }
  
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  return adminClient
}

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

export const getClientUser = async () => {
  try {
    console.log('=== SUPABASE: getClientUser called (client component) ===')
    
    // Use createClientComponentClient for proper session handling in client components
    const clientSupabase = createClientComponentClient()
    
    // Try getSession first (most reliable for client components)
    try {
      const { data: { session }, error } = await clientSupabase.auth.getSession()
      console.log('=== SUPABASE: Client getSession ===', { hasSession: !!session, error: error?.message })
      if (session?.user) {
        console.log('=== SUPABASE: User found from session ===', { userId: session.user.id })
        return session.user
      }
    } catch (e) {
      console.log('=== SUPABASE: getSession failed ===', e)
    }

    // Fallback to getUser
    try {
      const { data: { user }, error } = await clientSupabase.auth.getUser()
      console.log('=== SUPABASE: Client getUser ===', { hasUser: !!user, error: error?.message })
      if (user && !error) {
        console.log('=== SUPABASE: User found from getUser ===', { userId: user.id })
        return user
      }
    } catch (e) {
      console.log('=== SUPABASE: getUser failed ===', e)
    }

    console.log('=== SUPABASE: No authenticated user found (client) ===')
    return null
  } catch (error) {
    console.error('=== SUPABASE: Error in getClientUser ===', error)
    return null
  }
}

export const getCurrentUser = async (request?: Request) => {
  try {
    // For API routes, try to get user from Authorization header or session
    if (request) {
      console.log('=== SUPABASE: Getting user from API request ===')
      // Preferred: use auth-helpers with server cookies (works reliably with RLS)
      try {
        const { cookies } = await import('next/headers')
        const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
        const cookieStore = cookies()
        const rh = createRouteHandlerClient({ cookies: () => cookieStore })
        const { data } = await rh.auth.getUser()
        if (data?.user) {
          console.log('=== SUPABASE: User from routeHandlerClient ===', { userId: data.user.id })
          return data.user
        }
      } catch (e) {
        console.log('=== SUPABASE: routeHandlerClient user fetch failed, fallback ===', e)
      }
      
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
      
      // In API routes, we can't use client-side getUser() without a token
      // If we reach here in API context, authentication failed
      console.log('=== SUPABASE: No authentication method worked (API) ===')
      console.log('=== SUPABASE: Authorization header:', request?.headers.get('Authorization') ? 'present' : 'missing')
      return null
    }

    // Client-side context (no Request provided): use supabase client session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('=== SUPABASE: Client getSession ===', { hasSession: !!session, error: error?.message })
      if (session?.user) {
        return session.user
      }
    } catch (e) {
      console.log('=== SUPABASE: getSession failed, fallback to getUser ===', e)
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('=== SUPABASE: Client getUser ===', { hasUser: !!user, error: error?.message })
      if (user && !error) {
        return user
      }
    } catch (e) {
      console.log('=== SUPABASE: Client getUser failed ===', e)
    }

    // If we reach here, no authenticated user on client
    console.log('=== SUPABASE: No authenticated user (client) ===')
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
    // Use admin client to bypass RLS and ensure we can read subscriptions
    const admin = getAdminClient()
    const client = admin || supabase // Fallback to public client if admin not available
    
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
    // PostgREST returns array here; pick first row if exists
    const row = Array.isArray(data) ? (data[0] || null) : (data as any)
    if (row) {
      console.log(`=== getUserSubscription: Found subscription ===`, { 
        userId, 
        tier: row.tier, 
        status: row.status,
        planLimit: row.plan_limit,
        chatLimit: row.chat_limit,
        createdAt: row.created_at
      })
      return { data: row, error }
    }
    
    // FALLBACK: If no subscription record, try to get tier from profiles table
    console.log(`=== getUserSubscription: No subscription record found, checking profiles table...`, { userId })
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .select('subscription_tier, chat_count, plan_count, updated_at')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.log(`No profile found for user ${userId}, using defaults`)
      return { data: null, error: null }
    }
    
    console.log(`=== getUserSubscription: Profile data retrieved ===`, {
      userId,
      tier: profileData?.subscription_tier,
      chatCount: profileData?.chat_count,
      planCount: profileData?.plan_count,
      hasData: !!profileData
    });
    
    if (profileData?.subscription_tier && profileData.subscription_tier !== 'free') {
      // User has a paid tier in profiles but no subscription record
      // Create a subscription record to sync the data
      console.log(`=== getUserSubscription: Found PAID tier in profiles, creating subscription record ===`, { 
        userId, 
        tier: profileData.subscription_tier,
        chatCount: profileData.chat_count,
        planCount: profileData.plan_count
      })
      
      const now = new Date().toISOString()
      const { getSubscriptionLimits: getSubLimits } = await import('@/lib/supabase')
      const limits = getSubLimits(profileData.subscription_tier)
      
      try {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30);
        
        const { data: newSub, error: insertError } = await client
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier: profileData.subscription_tier,
            status: 'active',
            plan_limit: limits.plans,
            chat_limit: limits.chats,
            current_period_start: now,
            current_period_end: endDate.toISOString(),
            created_at: now
          })
          .select()
          .single()
        
        if (!insertError && newSub) {
          console.log(`=== getUserSubscription: Successfully created subscription record ===`, { userId, tier: newSub.tier })
          return { data: newSub, error: null }
        } else if (insertError) {
          console.error(`=== getUserSubscription: Failed to create subscription record ===`, insertError)
        }
      } catch (e) {
        console.error(`=== getUserSubscription: Exception creating subscription record ===`, e)
      }
      
      // Return profile data as fallback if subscription creation fails
      console.log(`=== getUserSubscription: Returning profile data as fallback ===`, {
        userId,
        tier: profileData.subscription_tier,
        chatCount: profileData.chat_count,
        planCount: profileData.plan_count
      })
      return { 
        data: {
          user_id: userId,
          tier: profileData.subscription_tier,
          status: 'active',
          plan_limit: limits.plans,
          chat_limit: limits.chats,
          chat_count: profileData.chat_count,
          plan_count: profileData.plan_count,
          updated_at: profileData.updated_at
        }, 
        error: null 
      }
    }
    
    // User has free tier in profiles
    console.log(`=== getUserSubscription: User has FREE tier in profiles ===`, { userId })
    return { data: null, error: null }
  } catch (err) {
    console.error('Error getting subscription:', err)
    return { data: null, error: err }
  }
}

export const getSubscriptionLimits = (tier: string) => {
  // Default limits (fallback if database doesn't have subscription)
  // Updated per user requirements (Nov 13, 2025):
  // Free: 4000 từ (giảm từ 5000 để tối ưu cost)
  // Gói 1, 2, 3: Tối đa 50.000 từ mỗi bản kế hoạch
  const defaultLimits = {
    'free': { plans: 1, chats: 5, words: 4000, allowSheets: false, allowNotion: false },        // Free tier: up to 4000 words (cost optimization)
    'basic': { plans: 1, chats: 40, words: 50000, allowSheets: true, allowNotion: true },       // Gói 1: Up to 50k words per plan
    'pro': { plans: 2, chats: 100, words: 50000, allowSheets: true, allowNotion: true },        // Gói 2: Up to 50k words per plan
    'pro_max': { plans: 5, chats: 270, words: 50000, allowSheets: true, allowNotion: true }     // Gói 3: Up to 50k words per plan
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

export const getUserUsageStats = async (userId: string, request?: Request) => {
  let planCount = 0 as number
  let chatCount = 0 as number
  let chatsError: any = null
  let plansError: any = null
  let wordsError: any = null
  let totalWords = 0

  // Prefer route-handler client (RLS via cookies) when in API context
  try {
    if (request) {
      const { cookies } = await import('next/headers')
      const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs')
      const cookieStore = cookies()
      const rh = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Get user's subscription to determine usage period
      const { data: subscriptions } = await rh
        .from('subscriptions')
        .select('created_at, tier')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions

      // Determine usage start date:
      // - If user has active subscription (paid tier), count from subscription creation
      // - Otherwise, count from start of month (free tier)
      let usageStartDate: Date
      if (subscription?.tier && subscription.tier !== 'free') {
        // Paid tier: count from when subscription was created (when they upgraded)
        usageStartDate = new Date(subscription.created_at)
      } else {
        // Free tier: count from start of month
        usageStartDate = new Date()
        usageStartDate.setDate(1)
        usageStartDate.setHours(0, 0, 0, 0)
      }

      const plansRes = await rh
        .from('plans')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', usageStartDate.toISOString())
      planCount = plansRes.count || 0
      plansError = plansRes.error

      const chatsRes = await rh
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'user')
        .gte('created_at', usageStartDate.toISOString())
      chatCount = chatsRes.count || 0
      
      const wordsRes = await rh
        .from('plans')
        .select('word_count')
        .eq('user_id', userId)
        .gte('created_at', usageStartDate.toISOString())

      totalWords = (wordsRes.data || []).reduce((sum: number, p: any) => sum + (p?.word_count || 0), 0)
      return {
        plans: planCount,
        chats: chatCount,
        words: totalWords,
        error: plansError || chatsRes.error || wordsRes.error
      }
    }
  } catch (e) {
    // Fall through to anon client path
  }

  // Fallback: Get subscription and determine usage period
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('created_at, tier')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions

  // Determine usage start date (same logic as above)
  let usageStartDate: Date
  if (subscription?.tier && subscription.tier !== 'free') {
    usageStartDate = new Date(subscription.created_at)
  } else {
    usageStartDate = new Date()
    usageStartDate.setDate(1)
    usageStartDate.setHours(0, 0, 0, 0)
  }

  // Count chat messages from usage start date (user messages only)
  try {
    const res = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'user')
      .gte('created_at', usageStartDate.toISOString())

    chatsError = res.error
    if (chatsError) {
      console.warn('getUserUsageStats: chat query error', chatsError)
      // Fallback: try without type filter and count manually
      const fallbackRes = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: false })
        .eq('user_id', userId)
        .gte('created_at', usageStartDate.toISOString())

      if (!fallbackRes.error) {
        chatCount = fallbackRes.data?.filter((_, i) => i % 2 === 0).length || 0
        chatsError = null
      } else {
        chatCount = fallbackRes.count || 0
      }
    } else {
      chatCount = res.count || 0
    }
  } catch (e) {
    console.error('getUserUsageStats: chat query exception', e)
    chatsError = e
  }

  // Sum word count from plans within usage period
  const { data: wordsData, error: wordsErrorLocal } = await supabase
    .from('plans')
    .select('word_count')
    .eq('user_id', userId)
    .gte('created_at', usageStartDate.toISOString())

  totalWords = wordsData?.reduce((sum, plan) => sum + (plan.word_count || 0), 0) || 0
  wordsError = wordsErrorLocal

  console.log('=== USER USAGE STATS ===', {
    userId,
    usagePeriodStart: usageStartDate.toISOString(),
    plans: planCount,
    chats: chatCount,
    words: totalWords,
    plansError: plansError?.message,
    chatsError: chatsError?.message,
    wordsError: wordsError?.message
  })

  return {
    plans: planCount,
    chats: chatCount,
    words: totalWords,
    error: plansError || chatsError || wordsError
  }
}

export const checkUsageLimits = async (userId: string, action: 'chat' | 'plan', request?: Request) => {
  // Get user subscription
  const { data: subscription } = await getUserSubscription(userId)

  let tier = 'free'
  let limits = getSubscriptionLimits(tier) // Default limits
  const DAY_MS = 24 * 60 * 60 * 1000
  let isExpired = false

  // If subscription exists in database, use those limits
  if (subscription) {
    tier = subscription.tier
    // Use database limits if they exist, otherwise fallback to defaults
    limits = {
      plans: subscription.plan_limit || getSubscriptionLimits(tier).plans,
      chats: subscription.chat_limit || getSubscriptionLimits(tier).chats,
      words: subscription.word_limit || getSubscriptionLimits(tier).words
    }

    // Enforce 30-day window
    try {
      const now = Date.now()
      if (subscription.tier === 'free') {
        const createdAt = subscription.created_at ? new Date(subscription.created_at).getTime() : 0
        if (createdAt) {
          const trialEnd = createdAt + 30 * DAY_MS
          isExpired = now > trialEnd
        }
      } else {
        const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end).getTime() : 0
        if (periodEnd) {
          isExpired = Date.now() > periodEnd
        }
      }
    } catch {}
  }

  // Get current usage - pass request to use route-handler client with RLS
  const usage = await getUserUsageStats(userId, request)

  // If subscription window expired, block further actions
  if (isExpired) {
    if (action === 'chat') {
      return {
        allowed: false,
        current: usage.chats,
        limit: limits.chats,
        tier,
        expired: true,
        reason: 'expired'
      }
    } else {
      return {
        allowed: false,
        current: usage.plans,
        limit: limits.plans,
        tier,
        expired: true,
        reason: 'expired'
      }
    }
  }

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
    
    // CRITICAL: Nếu không có subscription, lấy user creation date từ profiles table
    let createdAt: Date
    if (subscription) {
      createdAt = new Date(subscription.created_at)
    } else {
      // Lấy từ profiles table - handle 406 error gracefully
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle to handle missing profile gracefully
      
      if (profile?.created_at) {
        createdAt = new Date(profile.created_at)
      } else if (profileError) {
        // Profile query failed (e.g., 406 error) - fallback to auth user
        console.warn('Profile query failed:', profileError.message)
        const { data: { user } } = await supabase.auth.getUser()
        createdAt = user?.created_at ? new Date(user.created_at) : new Date()
      } else {
        // Profile doesn't exist yet - fallback to auth user
        const { data: { user } } = await supabase.auth.getUser()
        createdAt = user?.created_at ? new Date(user.created_at) : new Date()
      }
    }

    // For free tier, calculate trial period (30 days from account creation)
    const trialEnd = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    console.log('=== TRIAL STATUS ===', {
      userId,
      createdAt: createdAt.toISOString(),
      trialEnd: trialEnd.toISOString(),
      daysRemaining,
      isActive: daysRemaining > 0
    })

    return {
      hasActiveTrial: daysRemaining > 0,
      daysRemaining: daysRemaining,
      isActive: daysRemaining > 0
    }
  } catch (error) {
    console.error('Error checking trial status:', error)
    return { hasActiveTrial: false, daysRemaining: 0, isActive: false }
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

