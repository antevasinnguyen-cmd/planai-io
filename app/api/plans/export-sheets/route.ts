import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { extractTablesFromPlan, tableToCSV } from '@/lib/planTableUtils'
import { logger } from '@/lib/logger'

/**
 * Export plan tables to Google Sheets format
 * POST /api/plans/export-sheets
 */
export async function POST(request: NextRequest) {
  try {
    const { planId, format = 'csv' } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Get plan from database
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error || !plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Extract tables from plan content
    const tables = extractTablesFromPlan(plan.content)

    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'No tables found in plan' },
        { status: 400 }
      )
    }

    // Generate CSV content
    let csvContent = `Plan: ${plan.title}\nTạo lúc: ${new Date(plan.created_at).toLocaleString('vi-VN')}\n\n`

    tables.forEach((table, index) => {
      csvContent += `\n# ${table.title}\n`
      csvContent += tableToCSV(table)
      csvContent += '\n'
    })

    // Return as CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="plan-${planId}-${Date.now()}.csv"`
      }
    })
  } catch (error) {
    logger.error('EXPORT_SHEETS_CSV_ERROR', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to export plan' },
      { status: 500 }
    )
  }
}
