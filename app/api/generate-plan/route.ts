import { NextRequest, NextResponse } from 'next/server'
import { generateFinancialPlan } from '@/lib/openai'
import { getCurrentUser, getUserProfile, savePlan, checkUsageLimits, getUserSubscription, getSubscriptionLimits } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check usage limits before processing
    const usageCheck = await checkUsageLimits(user.id, 'plan')
    if (!usageCheck.allowed) {
      const { data: subscription } = await getUserSubscription(user.id)
      const limits = getSubscriptionLimits(usageCheck.tier)
      
      return NextResponse.json({ 
        error: 'Đã đạt giới hạn tạo kế hoạch',
        message: `Bạn đã tạo ${usageCheck.current}/${usageCheck.limit} kế hoạch trong tháng này. Hãy nâng cấp gói để tạo thêm kế hoạch.`,
        usage: {
          current: usageCheck.current,
          limit: usageCheck.limit,
          tier: usageCheck.tier
        },
        upgradeRequired: true
      }, { status: 429 })
    }

    // Get user profile
    const { data: profile } = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get subscription limits for word count
    const limits = getSubscriptionLimits(usageCheck.tier)
    const maxWords = limits.words

    // Generate plan using OpenAI with word limit
    const planContent = await generateFinancialPlan({
      ...profile,
      maxWords // Pass word limit to AI generation
    })
    
    // Calculate word count
    const wordCount = planContent.split(' ').length

    // Truncate if exceeds limit (safety check)
    let finalContent = planContent
    if (wordCount > maxWords) {
      const words = planContent.split(' ')
      finalContent = words.slice(0, maxWords).join(' ') + '\n\n[Kế hoạch đã được cắt ngắn theo giới hạn gói của bạn]'
    }

    // Save plan to database
    const planData = {
      title: `Kế hoạch tài chính: ${profile.financial_goal}`,
      goal: profile.financial_goal,
      content: finalContent,
      word_count: Math.min(wordCount, maxWords),
      status: 'completed'
    }

    const { data: savedPlan, error } = await savePlan(user.id, planData)
    
    if (error) {
      return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
    }

    // Return response with usage info
    const updatedUsage = await checkUsageLimits(user.id, 'plan')

    return NextResponse.json({ 
      plan: savedPlan,
      content: finalContent,
      wordCount: Math.min(wordCount, maxWords),
      success: true,
      usage: {
        current: updatedUsage.current + 1, // +1 for the plan just created
        limit: updatedUsage.limit,
        tier: updatedUsage.tier,
        remaining: updatedUsage.limit - (updatedUsage.current + 1),
        wordLimit: maxWords
      }
    })

  } catch (error) {
    console.error('Plan Generation API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
