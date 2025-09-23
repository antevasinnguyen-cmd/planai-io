// Google Sheets integration for exporting financial plans
import { google } from 'googleapis'

// Initialize Google Sheets API
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
})

const sheets = google.sheets({ version: 'v4', auth })

// Create a new spreadsheet
export const createSpreadsheet = async (title: string): Promise<string> => {
  try {
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title
        }
      }
    })

    return response.data.spreadsheetId || ''
  } catch (error) {
    console.error('Error creating spreadsheet:', error)
    throw error
  }
}

// Add data to a spreadsheet
export const addDataToSpreadsheet = async (
  spreadsheetId: string,
  sheetName: string,
  data: any[][]
): Promise<void> => {
  try {
    // Check if sheet exists, if not create it
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId
    })

    const sheetExists = spreadsheet.data.sheets?.some(
      sheet => sheet.properties?.title === sheetName
    )

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }
          ]
        }
      })
    }

    // Add data to sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: data
      }
    })
  } catch (error) {
    console.error('Error adding data to spreadsheet:', error)
    throw error
  }
}

// Export financial plan to Google Sheets
export const exportFinancialPlanToSheets = async (
  userId: string,
  planName: string,
  planData: any
): Promise<string> => {
  try {
    // Create a new spreadsheet
    const spreadsheetId = await createSpreadsheet(`PlanAI - ${planName}`)

    // Format plan data for sheets
    const summaryData = [
      ['PlanAI - Kế hoạch tài chính cá nhân'],
      ['Tên kế hoạch', planName],
      ['Ngày tạo', new Date().toLocaleDateString('vi-VN')],
      [''],
      ['Thông tin cá nhân'],
      ['Họ tên', planData.full_name || ''],
      ['Tuổi', planData.age || ''],
      ['Nghề nghiệp', planData.occupation || ''],
      ['Thu nhập', formatCurrency(planData.current_income) || ''],
      ['Mục tiêu', planData.financial_goal || ''],
      ['Thời gian', planData.timeline || ''],
      ['Mức độ rủi ro', planData.risk_tolerance || '']
    ]

    // Add summary data
    await addDataToSpreadsheet(spreadsheetId, 'Tổng quan', summaryData)

    // Format plan content
    const planContent = parsePlanContent(planData.content)
    
    // Add plan sections
    if (planContent.summary) {
      await addDataToSpreadsheet(spreadsheetId, 'Tóm tắt', [
        ['Tóm tắt kế hoạch'],
        [''],
        ...formatTextToRows(planContent.summary)
      ])
    }
    
    if (planContent.analysis) {
      await addDataToSpreadsheet(spreadsheetId, 'Phân tích', [
        ['Phân tích chi tiết'],
        [''],
        ...formatTextToRows(planContent.analysis)
      ])
    }
    
    if (planContent.roadmap) {
      await addDataToSpreadsheet(spreadsheetId, 'Lộ trình', [
        ['Lộ trình thực hiện'],
        [''],
        ...formatTextToRows(planContent.roadmap)
      ])
    }
    
    if (planContent.tasks) {
      const taskRows = [['Nhiệm vụ', 'Thời hạn', 'Trạng thái']]
      planContent.tasks.forEach((task: string) => {
        taskRows.push([task, '', ''])
      })
      await addDataToSpreadsheet(spreadsheetId, 'Nhiệm vụ', taskRows)
    }

    // Generate shareable link
    const shareableLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`
    return shareableLink
  } catch (error) {
    console.error('Error exporting plan to Google Sheets:', error)
    throw error
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

// Helper function to parse plan content into sections
const parsePlanContent = (content: string): any => {
  const sections: any = {
    summary: '',
    analysis: '',
    roadmap: '',
    tasks: []
  }

  // Simple parsing logic - can be enhanced
  const lines = content.split('\n')
  let currentSection = ''

  for (const line of lines) {
    if (line.toLowerCase().includes('tóm tắt') || line.toLowerCase().includes('summary')) {
      currentSection = 'summary'
      continue
    } else if (line.toLowerCase().includes('phân tích') || line.toLowerCase().includes('analysis')) {
      currentSection = 'analysis'
      continue
    } else if (line.toLowerCase().includes('lộ trình') || line.toLowerCase().includes('roadmap')) {
      currentSection = 'roadmap'
      continue
    } else if (line.toLowerCase().includes('nhiệm vụ') || line.toLowerCase().includes('tasks')) {
      currentSection = 'tasks'
      continue
    }

    if (currentSection === 'tasks' && line.trim().startsWith('- ')) {
      sections.tasks.push(line.trim().substring(2))
    } else if (currentSection && sections[currentSection] !== undefined) {
      if (typeof sections[currentSection] === 'string') {
        sections[currentSection] += line + '\n'
      }
    }
  }

  return sections
}

// Helper function to format text into rows for spreadsheet
const formatTextToRows = (text: string): string[][] => {
  return text.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => [line])
}
