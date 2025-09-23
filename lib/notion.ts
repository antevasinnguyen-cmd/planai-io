// Notion API integration for syncing financial plans
import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY
})

// Initialize NotionToMarkdown converter
const n2m = new NotionToMarkdown({ notionClient: notion })

// Create a new page in Notion
export const createNotionPage = async (
  databaseId: string,
  title: string,
  content: string,
  properties: Record<string, any> = {}
): Promise<string> => {
  try {
    // Convert content to blocks
    const blocks = await convertMarkdownToBlocks(content)

    // Create page
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        },
        ...formatProperties(properties)
      },
      children: blocks
    })

    return response.id
  } catch (error) {
    console.error('Error creating Notion page:', error)
    throw error
  }
}

// Export financial plan to Notion
export const exportFinancialPlanToNotion = async (
  userId: string,
  planName: string,
  planData: any,
  databaseId: string
): Promise<string> => {
  try {
    // Format properties
    const properties = {
      'Họ tên': planData.full_name || '',
      'Tuổi': planData.age || '',
      'Nghề nghiệp': planData.occupation || '',
      'Thu nhập': formatCurrency(planData.current_income) || '',
      'Mục tiêu': planData.financial_goal || '',
      'Thời gian': planData.timeline || '',
      'Mức độ rủi ro': planData.risk_tolerance || '',
      'Ngày tạo': new Date().toISOString()
    }

    // Format content
    const content = formatPlanContent(planData)

    // Create page
    const pageId = await createNotionPage(
      databaseId,
      `PlanAI - ${planName}`,
      content,
      properties
    )

    return `https://notion.so/${pageId.replace(/-/g, '')}`
  } catch (error) {
    console.error('Error exporting plan to Notion:', error)
    throw error
  }
}

// Get or create database for financial plans
export const getOrCreateFinancialPlanDatabase = async (
  userId: string
): Promise<string> => {
  try {
    // Try to find existing database
    const response = await notion.search({
      query: 'PlanAI Financial Plans',
      filter: {
        property: 'object',
        value: 'database'
      }
    })

    if (response.results.length > 0) {
      return response.results[0].id
    }

    // Create new database
    const newDatabase = await notion.databases.create({
      parent: {
        type: 'workspace',
        workspace: true
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'PlanAI Financial Plans'
          }
        }
      ],
      properties: {
        Name: {
          title: {}
        },
        'Họ tên': {
          rich_text: {}
        },
        'Tuổi': {
          number: {}
        },
        'Nghề nghiệp': {
          rich_text: {}
        },
        'Thu nhập': {
          rich_text: {}
        },
        'Mục tiêu': {
          rich_text: {}
        },
        'Thời gian': {
          rich_text: {}
        },
        'Mức độ rủi ro': {
          select: {
            options: [
              { name: 'Thấp', color: 'green' },
              { name: 'Trung bình', color: 'yellow' },
              { name: 'Cao', color: 'red' }
            ]
          }
        },
        'Ngày tạo': {
          date: {}
        }
      }
    })

    return newDatabase.id
  } catch (error) {
    console.error('Error getting or creating Notion database:', error)
    throw error
  }
}

// Helper function to format plan content
const formatPlanContent = (planData: any): string => {
  return `# PlanAI - Kế hoạch tài chính cá nhân hóa

## Thông tin cá nhân
- **Họ tên:** ${planData.full_name || ''}
- **Tuổi:** ${planData.age || ''}
- **Nghề nghiệp:** ${planData.occupation || ''}
- **Thu nhập:** ${formatCurrency(planData.current_income) || ''}
- **Mục tiêu:** ${planData.financial_goal || ''}
- **Thời gian:** ${planData.timeline || ''}
- **Mức độ rủi ro:** ${planData.risk_tolerance || ''}

## Nội dung kế hoạch
${planData.content || ''}
`
}

// Helper function to format properties for Notion
const formatProperties = (properties: Record<string, any>): Record<string, any> => {
  const formattedProps: Record<string, any> = {}

  for (const [key, value] of Object.entries(properties)) {
    if (key === 'Ngày tạo' && typeof value === 'string') {
      formattedProps[key] = {
        date: {
          start: value
        }
      }
    } else if (key === 'Tuổi' && typeof value === 'number') {
      formattedProps[key] = {
        number: value
      }
    } else if (key === 'Mức độ rủi ro' && typeof value === 'string') {
      formattedProps[key] = {
        select: {
          name: value
        }
      }
    } else if (typeof value === 'string') {
      formattedProps[key] = {
        rich_text: [
          {
            text: {
              content: value
            }
          }
        ]
      }
    }
  }

  return formattedProps
}

// Helper function to convert markdown to Notion blocks
const convertMarkdownToBlocks = async (markdown: string): Promise<any[]> => {
  try {
    // Simple implementation - in a real app, use a proper markdown parser
    const blocks: any[] = []
    const lines = markdown.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line === '') continue
      
      if (line.startsWith('# ')) {
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.substring(2) } }]
          }
        })
      } else if (line.startsWith('## ')) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.substring(3) } }]
          }
        })
      } else if (line.startsWith('### ')) {
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: line.substring(4) } }]
          }
        })
      } else if (line.startsWith('- ')) {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: line.substring(2) } }]
          }
        })
      } else {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: line } }]
          }
        })
      }
    }
    
    return blocks
  } catch (error) {
    console.error('Error converting markdown to blocks:', error)
    return []
  }
}

// Helper function to format currency
const formatCurrency = (amount?: number): string => {
  if (!amount) return ''
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
