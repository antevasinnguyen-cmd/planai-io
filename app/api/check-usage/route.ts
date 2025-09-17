import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, checkUsageLimits } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check usage limits
    const usageCheck = await checkUsageLimits(user.id, action)
    
    return NextResponse.json(usageCheck)

  } catch (error) {
    console.error('Check Usage API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
