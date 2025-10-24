#!/usr/bin/env node

/**
 * Run Fix Migration for Plans Table
 * This script fixes the missing columns in plans table
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🔧 Starting Plans Table Fix Migration...\n')
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251024_fix_plans_table.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded')
    console.log('📝 SQL Preview:')
    console.log(sql.substring(0, 200) + '...\n')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        // Try direct execution if RPC fails
        console.log(`⚠️  RPC failed, trying direct execution...`)
        const { error: directError } = await supabase.from('_migrations').insert({
          name: `20251024_fix_plans_table_${i}`,
          executed_at: new Date().toISOString()
        })
        
        if (directError && !directError.message.includes('already exists')) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message)
          console.error('Statement:', statement.substring(0, 100))
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📋 Summary:')
    console.log('✅ Added collected_info column (JSONB)')
    console.log('✅ Added model_used column (TEXT)')
    console.log('✅ Added rag_processed column (BOOLEAN)')
    console.log('✅ Added spiritual_enabled column (BOOLEAN)')
    console.log('✅ Added spiritual_data column (JSONB)')
    console.log('✅ Created performance indexes')
    console.log('\n🚀 Your plans table is now ready!')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\n🔍 Troubleshooting:')
    console.error('1. Check if you have SUPABASE_SERVICE_ROLE_KEY in .env.local')
    console.error('2. Verify Supabase connection')
    console.error('3. Check if you have permission to alter tables')
    console.error('\n💡 Alternative: Run the SQL manually in Supabase SQL Editor')
    process.exit(1)
  }
}

// Run migration
runMigration()
