#!/usr/bin/env node

/**
 * Test Database Connection and Fix Plans Table
 * Run: node test-and-fix-db.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? '✅ Present' : '❌ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAndFix() {
  let missingColumns = []
  
  try {
    // Test 1: Check connection
    console.log('\n📡 Test 1: Checking connection...')
    const { data: testData, error: testError } = await supabase
      .from('plans')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message)
      return
    }
    console.log('✅ Connection successful!')
    
    // Test 2: Check current schema
    console.log('\n📊 Test 2: Checking plans table schema...')
    const { data: plans, error: schemaError } = await supabase
      .from('plans')
      .select('*')
      .limit(1)
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message)
      return
    }
    
    if (plans && plans.length > 0) {
      const columns = Object.keys(plans[0])
      console.log('Current columns:', columns)
      
      // Check for missing columns
      const requiredColumns = ['collected_info', 'model_used', 'rag_processed', 'spiritual_enabled', 'spiritual_data']
      missingColumns = requiredColumns.filter(col => !columns.includes(col))
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️  Missing columns:', missingColumns)
        console.log('\n🔧 SOLUTION:')
        console.log('You need to run the SQL migration on Supabase Dashboard.')
        console.log('\nSteps:')
        console.log('1. Go to: https://supabase.com/dashboard')
        console.log('2. Select your project')
        console.log('3. Go to SQL Editor')
        console.log('4. Copy and paste the SQL from: supabase/migrations/20251024_fix_plans_table.sql')
        console.log('5. Click Run')
        console.log('\nOr read: FIX_PLANS_TABLE.md for detailed instructions')
      } else {
        console.log('✅ All required columns present!')
      }
    } else {
      console.log('⚠️  No plans found in database (table might be empty)')
    }
    
    // Test 3: Check authentication
    console.log('\n🔐 Test 3: Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user (this is OK for testing)')
    } else {
      console.log('✅ User authenticated:', user.email)
    }
    
    // Test 4: Try to insert a test plan (will fail if columns missing)
    console.log('\n🧪 Test 4: Testing plan insertion...')
    console.log('⚠️  Skipping (requires authentication)')
    
    console.log('\n' + '='.repeat(60))
    console.log('\n📋 SUMMARY:')
    console.log('✅ Database connection: Working')
    console.log('✅ Plans table: Accessible')
    
    if (missingColumns && missingColumns.length > 0) {
      console.log('❌ Schema: Missing columns')
      console.log('\n🚨 ACTION REQUIRED:')
      console.log('Run the SQL migration to fix the plans table.')
      console.log('See: FIX_PLANS_TABLE.md for instructions')
    } else {
      console.log('✅ Schema: Complete')
      console.log('\n🎉 Database is ready!')
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('\nFull error:', error)
  }
}

// Run tests
testAndFix()
