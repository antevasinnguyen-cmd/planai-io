export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  age?: number
  gender?: string
  location?: string
  occupation?: string
  current_income?: number
  target_income?: number
  financial_goal?: string
  timeline?: string
  risk_tolerance?: 'low' | 'medium' | 'high'
  education_level?: string
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  subscription_tier?: 'free' | 'basic' | 'pro' | 'pro_max'
  chat_count?: number
  plan_count?: number
  spiritual_enabled?: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  message: string
  type: 'user' | 'ai'
  created_at: string
}

export interface Plan {
  id: string
  user_id: string
  title: string
  goal: string
  content: string
  word_count: number
  status: 'draft' | 'completed' | 'archived'
  version: number
  metadata?: {
    timeline?: string
    target_amount?: number
    success_probability?: number
    sections?: string[]
  }
  created_at: string
  updated_at: string
}

export interface SubscriptionTier {
  id: string
  name: string
  price: number
  currency: string
  chat_limit: number
  plan_limit: number
  word_limit: number
  features: string[]
  is_popular?: boolean
}

export interface Payment {
  id: string
  user_id: string
  subscription_tier: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string
  transaction_id?: string
  created_at: string
}

export interface OnboardingData {
  step: number
  financial_goal: string
  target_amount?: number
  timeline: string
  current_income: number
  age: number
  occupation: string
  location: string
  risk_tolerance: 'low' | 'medium' | 'high'
  additional_info?: string
}
