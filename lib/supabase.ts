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

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
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

