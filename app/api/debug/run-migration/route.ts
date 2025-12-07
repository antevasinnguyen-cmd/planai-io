import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to run database migrations
 * This adds the 'metadata' column to plan_jobs table if it doesn't exist
 * 
 * IMPORTANT: This should be removed or secured in production
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }
    
    const admin = createClient(supabaseUrl, serviceKey)
    
    // Check if metadata column exists
    const { data: columns, error: checkError } = await admin
      .rpc('get_column_info', { 
        p_table_name: 'plan_jobs', 
        p_column_name: 'metadata' 
      })
    
    // If RPC doesn't exist, try direct query approach
    // We'll just try to add the column - if it exists, it will fail gracefully
    
    // Try to add the metadata column using raw SQL via RPC
    // Since we can't run raw SQL directly, we'll use a workaround:
    // Try to update a non-existent row with metadata - if column doesn't exist, it will error
    
    const testResult = await admin
      .from('plan_jobs')
      .select('id, metadata')
      .limit(1)
    
    if (testResult.error && testResult.error.message.includes('metadata')) {
      // Column doesn't exist - need to add it via Supabase Dashboard
      return NextResponse.json({
        success: false,
        message: 'The metadata column does not exist in plan_jobs table.',
        action_required: 'Please run this SQL in Supabase Dashboard SQL Editor:',
        sql: `ALTER TABLE plan_jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;`
      }, { status: 400 })
    }
    
    // Column exists
    return NextResponse.json({
      success: true,
      message: 'The metadata column already exists in plan_jobs table.',
      sample: testResult.data
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error?.message || 'Unknown error',
      action_required: 'Please run this SQL in Supabase Dashboard SQL Editor:',
      sql: `ALTER TABLE plan_jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;`
    }, { status: 500 })
  }
}
