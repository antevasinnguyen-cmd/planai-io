import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getPlanById } from '@/lib/supabase'
import { generateNotionBlocks } from '@/lib/export'

export async function POST(request: NextRequest) {
  try {
    const { planId, format, notionToken, notionPageId } = await request.json()
    
    // Verify user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get plan
    const { data: plan, error } = await getPlanById(planId)
    if (error || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Verify plan ownership
    if (plan.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    switch (format) {
      case 'notion':
        if (!notionToken) {
          return NextResponse.json({ error: 'Notion token required' }, { status: 400 })
        }
        
        try {
          const blocks = generateNotionBlocks(plan.content)
          
          // Create Notion page
          const notionResponse = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${notionToken}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
              parent: { page_id: notionPageId },
              properties: {
                title: {
                  title: [{ text: { content: plan.title } }]
                }
              },
              children: blocks
            })
          })

          const notionResult = await notionResponse.json()
          
          if (notionResponse.ok) {
            return NextResponse.json({ 
              success: true, 
              notionUrl: notionResult.url 
            })
          } else {
            return NextResponse.json({ 
              error: 'Notion export failed',
              details: notionResult.message 
            }, { status: 400 })
          }
        } catch (error) {
          return NextResponse.json({ 
            error: 'Notion API error',
            details: error 
          }, { status: 500 })
        }

      case 'sheets':
        // Google Sheets export logic would go here
        return NextResponse.json({ 
          success: true, 
          message: 'Google Sheets export coming soon' 
        })

      default:
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Export API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
