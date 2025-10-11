import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

// Credentials for service account (should be stored in environment variables)
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const GOOGLE_SHEETS_TEMPLATE_ID = process.env.GOOGLE_SHEETS_TEMPLATE_ID

// Initialize Google Sheets API client
const getGoogleSheetsClient = () => {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google API credentials not configured')
  }

  const auth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  })

  return google.sheets({ version: 'v4', auth })
}

// Create a new spreadsheet from template
export const createSpreadsheetFromTemplate = async (title: string): Promise<string> => {
  try {
    const auth = getGoogleSheetsClient().context._options.auth
    const drive = google.drive({ version: 'v3', auth })
    
    // Copy the template spreadsheet
    const response = await drive.files.copy({
      fileId: GOOGLE_SHEETS_TEMPLATE_ID,
      requestBody: {
        name: title,
      },
    })

    if (!response.data.id) {
      throw new Error('Failed to create spreadsheet from template')
    }

    // Make the spreadsheet accessible to anyone with the link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return response.data.id
  } catch (error) {
    console.error('Error creating spreadsheet from template:', error)
    throw error
  }
}

// Export financial plan to Google Sheets
export const exportPlanToGoogleSheets = async (
  planData: any,
  userId: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  try {
    const sheets = getGoogleSheetsClient()
    
    // Create a new spreadsheet from template
    const spreadsheetId = await createSpreadsheetFromTemplate(`PlanAI - Kế hoạch tài chính - ${new Date().toLocaleDateString('vi-VN')}`)
    
    // Extract data from plan
    const { title, content, created_at } = planData
    
    // Parse content to extract sections
    const sections = parsePlanContent(content)
    
    // Update the spreadsheet with plan data
    const updates = [
      {
        range: 'Overview!B2',
        values: [[title]],
      },
      {
        range: 'Overview!B3',
        values: [[new Date(created_at).toLocaleDateString('vi-VN')]],
      },
      {
        range: 'Overview!B4',
        values: [[userId]],
      },
    ]
    
    // Add sections to their respective sheets
    if (sections.summary) {
      updates.push({
        range: 'Tóm tắt!A2',
        values: [[sections.summary]],
      })
    }
    
    if (sections.analysis) {
      updates.push({
        range: 'Phân tích!A2',
        values: [[sections.analysis]],
      })
    }
    
    if (sections.roadmap) {
      updates.push({
        range: 'Lộ trình!A2',
        values: [[sections.roadmap]],
      })
    }
    
    if (sections.budget) {
      updates.push({
        range: 'Ngân sách!A2',
        values: [[sections.budget]],
      })
    }
    
    if (sections.timeline) {
      updates.push({
        range: 'Timeline!A2',
        values: [[sections.timeline]],
      })
    }
    
    if (sections.checklist) {
      updates.push({
        range: 'Checklist!A2',
        values: [[sections.checklist]],
      })
    }
    
    if (sections.risks) {
      updates.push({
        range: 'Rủi ro!A2',
        values: [[sections.risks]],
      })
    }
    
    if (sections.advice) {
      updates.push({
        range: 'Lời khuyên!A2',
        values: [[sections.advice]],
      })
    }
    
    // Update the spreadsheet
    await Promise.all(
      updates.map(update => 
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: update.range,
          valueInputOption: 'RAW',
          requestBody: {
            values: update.values,
          },
        })
      )
    )
    
    // Get the spreadsheet URL
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    
    return { spreadsheetId, spreadsheetUrl }
  } catch (error) {
    console.error('Error exporting plan to Google Sheets:', error)
    throw error
  }
}

// Helper function to parse plan content into sections
const parsePlanContent = (content: string): Record<string, string> => {
  const sections: Record<string, string> = {
    summary: '',
    analysis: '',
    roadmap: '',
    budget: '',
    timeline: '',
    checklist: '',
    risks: '',
    advice: '',
  }
  
  // Simple parsing based on markdown headings
  const lines = content.split('\n')
  let currentSection = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.startsWith('# ') || line.startsWith('## ')) {
      const lowerLine = line.toLowerCase()
      
      if (lowerLine.includes('tóm tắt') || lowerLine.includes('mục tiêu')) {
        currentSection = 'summary'
        continue
      } else if (lowerLine.includes('phân tích') || lowerLine.includes('hiện tại')) {
        currentSection = 'analysis'
        continue
      } else if (lowerLine.includes('lộ trình') || lowerLine.includes('bước')) {
        currentSection = 'roadmap'
        continue
      } else if (lowerLine.includes('ngân sách') || lowerLine.includes('tài chính')) {
        currentSection = 'budget'
        continue
      } else if (lowerLine.includes('timeline') || lowerLine.includes('thời gian')) {
        currentSection = 'timeline'
        continue
      } else if (lowerLine.includes('checklist') || lowerLine.includes('hành động')) {
        currentSection = 'checklist'
        continue
      } else if (lowerLine.includes('rủi ro') || lowerLine.includes('thách thức')) {
        currentSection = 'risks'
        continue
      } else if (lowerLine.includes('lời khuyên') || lowerLine.includes('động viên')) {
        currentSection = 'advice'
        continue
      }
    }
    
    if (currentSection && sections[currentSection] !== undefined) {
      sections[currentSection] += line + '\n'
    }
  }
  
  // Trim whitespace
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim()
  })
  
  return sections
}

// Function to check if Google Sheets API is configured
export const isGoogleSheetsConfigured = (): boolean => {
  return Boolean(GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SHEETS_TEMPLATE_ID)
}
