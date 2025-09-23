#!/usr/bin/env node

// Script to run database migrations for PlanAI hybrid approach
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://wjzmscsoiibzlxejqpgg.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem1zY3NvaWliemx4ZWpxcGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NDA4MiwiZXhwIjoyMDczMzUwMDgyfQ.C0OlpsyqnnG6CaMDnhv4M6GI4lTN3AyK4sldWl_UpZk'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function runMigration(migrationPath) {
  try {
    console.log(`Running migration: ${migrationPath}`)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error('Error executing statement:', error)
          throw error
        }
      }
    }

    console.log(`✅ Migration completed: ${migrationPath}`)
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationPath}`, error)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 Starting database migrations for PlanAI hybrid approach...')

    // Get migration files
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    console.log(`Found ${migrationFiles.length} migration files`)

    // Run migrations
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file)
      await runMigration(migrationPath)
    }

    console.log('🎉 All migrations completed successfully!')
  } catch (error) {
    console.error('Migration process failed:', error)
    process.exit(1)
  }
}

main()
