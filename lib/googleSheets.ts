import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

// Credentials for service account (should be stored in environment variables)
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL

// Normalize private key so it works regardless of how it's entered in Vercel/.env
// Handles both:
// - Multiline PEM (with real newlines)
// - Single-line with literal \n characters
// - Values accidentally wrapped in single/double quotes
const normalizePrivateKey = (raw?: string | null): string | undefined => {
  if (!raw) return undefined

  let key = raw

  // Trim surrounding whitespace
  key = key.trim()

  // Remove wrapping single/double quotes if user copied with quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith('\'') && key.endsWith('\''))) {
    key = key.slice(1, -1).trim()
  }

  // Convert escaped newlines ("\n") to real newlines
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n')
  }

  // Normalise CRLF/CR to LF
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Final trim
  key = key.trim()

  return key || undefined
}

const GOOGLE_PRIVATE_KEY = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)
const GOOGLE_SHEETS_TEMPLATE_ID = process.env.GOOGLE_SHEETS_TEMPLATE_ID

// Initialize Google Sheets API client with Service Account
const getGoogleSheetsClient = () => {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials not configured. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.')
  }

  if (!GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    // Fail fast with clear error instead of opaque OpenSSL decoder error
    throw new Error('GOOGLE_PRIVATE_KEY is not in valid PEM format. It must start with -----BEGIN PRIVATE KEY-----')
  }

  const auth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ]
  })

  return google.sheets({ version: 'v4', auth })
}

// Get Google Drive client for file operations
const getGoogleDriveClient = () => {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials not configured.')
  }

  if (!GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    throw new Error('GOOGLE_PRIVATE_KEY is not in valid PEM format. It must start with -----BEGIN PRIVATE KEY-----')
  }

  const auth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ],
  })

  return google.drive({ version: 'v3', auth })
}

// Create a new spreadsheet - either from template or from scratch
// Always makes it publicly accessible (anyone with link can edit)
export const createSpreadsheetFromTemplate = async (title: string): Promise<string> => {
  try {
    console.log('createSpreadsheetFromTemplate: Starting with title:', title)
    console.log('createSpreadsheetFromTemplate: GOOGLE_CLIENT_EMAIL:', GOOGLE_CLIENT_EMAIL)
    console.log('createSpreadsheetFromTemplate: GOOGLE_PRIVATE_KEY exists:', !!GOOGLE_PRIVATE_KEY)
    console.log('createSpreadsheetFromTemplate: GOOGLE_SHEETS_TEMPLATE_ID:', GOOGLE_SHEETS_TEMPLATE_ID)
    
    const drive = getGoogleDriveClient()
    const sheets = getGoogleSheetsClient()
    
    let spreadsheetId: string
    
    // Try to copy from template if available
    if (GOOGLE_SHEETS_TEMPLATE_ID) {
      try {
        console.log('createSpreadsheetFromTemplate: Attempting to copy template:', GOOGLE_SHEETS_TEMPLATE_ID)
        const response = await drive.files.copy({
          fileId: GOOGLE_SHEETS_TEMPLATE_ID,
          requestBody: {
            name: title,
          },
        })
        
        if (response.data.id) {
          spreadsheetId = response.data.id
          console.log('createSpreadsheetFromTemplate: Created spreadsheet from template:', spreadsheetId)
        } else {
          throw new Error('No ID returned from template copy')
        }
      } catch (templateError) {
        console.warn('createSpreadsheetFromTemplate: Failed to copy template, creating new spreadsheet:', templateError)
        // Fall through to create new spreadsheet
        spreadsheetId = ''
      }
    } else {
      console.log('createSpreadsheetFromTemplate: No template ID provided, will create from scratch')
      spreadsheetId = ''
    }
    
    // If no template or template copy failed, create new spreadsheet from scratch
    if (!spreadsheetId) {
      try {
        console.log('createSpreadsheetFromTemplate: Creating new spreadsheet from scratch')
        
        // Create with minimal properties first to avoid permission issues
        const newSpreadsheet = await sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: title,
              locale: 'vi_VN',
              autoRecalc: 'ON_CHANGE'
            },
            sheets: [
              { properties: { title: 'Overview', sheetId: 0 } },
              { properties: { title: 'Tóm tắt', sheetId: 1 } },
              { properties: { title: 'Phân tích', sheetId: 2 } },
              { properties: { title: 'Lộ trình', sheetId: 3 } },
              { properties: { title: 'Ngân sách', sheetId: 4 } },
              { properties: { title: 'Timeline', sheetId: 5 } },
              { properties: { title: 'Checklist', sheetId: 6 } },
              { properties: { title: 'Rủi ro', sheetId: 7 } },
              { properties: { title: 'Lời khuyên', sheetId: 8 } },
            ]
          }
        })
        
        if (!newSpreadsheet.data.spreadsheetId) {
          throw new Error('Failed to create new spreadsheet - no ID returned')
        }
        
        spreadsheetId = newSpreadsheet.data.spreadsheetId
        console.log('createSpreadsheetFromTemplate: Created new spreadsheet from scratch:', spreadsheetId)
      } catch (createError) {
        console.error('createSpreadsheetFromTemplate: Error creating spreadsheet:', createError)
        // Log full error details for debugging
        if (createError instanceof Error) {
          console.error('createSpreadsheetFromTemplate: Error message:', createError.message)
          console.error('createSpreadsheetFromTemplate: Error stack:', createError.stack)
        }
        throw new Error(`Failed to create spreadsheet: ${createError instanceof Error ? createError.message : String(createError)}`)
      }
    }

    // CRITICAL: Make the spreadsheet publicly accessible - anyone with link can EDIT
    try {
      console.log('createSpreadsheetFromTemplate: Setting public permissions for spreadsheet:', spreadsheetId)
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'writer',  // Anyone can edit
          type: 'anyone',  // No login required
        },
      })
      console.log('createSpreadsheetFromTemplate: Set public permissions for spreadsheet:', spreadsheetId)
    } catch (permError) {
      console.warn('createSpreadsheetFromTemplate: Failed to set public permissions (non-critical):', permError)
      // Non-critical error - spreadsheet was created successfully
    }

    return spreadsheetId
  } catch (error) {
    console.error('createSpreadsheetFromTemplate: Error creating spreadsheet:', error)
    throw error
  }
}

// Ensure required sheets exist
const ensureSheets = async (spreadsheetId: string, names: string[]) => {
  const sheets = getGoogleSheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const existing = new Set((meta.data.sheets || []).map(s => s.properties?.title || ''))
  const requests = names
    .filter(n => n && !existing.has(n))
    .map(n => ({ addSheet: { properties: { title: n } } }))
  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } })
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
    const structured = planData?.collected_info?.structured_data || null
    
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
    
    // Ensure required tabs for paid template exist and write basic headers
    const requiredTabs = ['Dashboard', 'Roadmap', 'Checklist', 'TietKiem', 'TangThuNhap', 'BusinessMetrics', 'KyNang_TaiLieu']
    await ensureSheets(spreadsheetId, requiredTabs)

    const tableUpdates: Array<{ range: string; values: any[][] }> = []

    // Roadmap tab
    tableUpdates.push({ range: 'Roadmap!A1', values: [[ 'Level', 'Task', 'Start', 'End', 'Milestone', 'KPI', 'Dependencies', 'Status' ]] })

    // Checklist tab with checkbox target in first column
    tableUpdates.push({ range: 'Checklist!A1', values: [[ 'Done', 'Time', 'Action', 'Learning Link' ]] })

    // Finance tabs
    tableUpdates.push({ range: 'TietKiem!A1', values: [[ 'Date', 'Category', 'Amount', 'Note' ]] })
    tableUpdates.push({ range: 'TangThuNhap!A1', values: [[ 'Date', 'Source', 'Amount', 'Note' ]] })

    // Business metrics tab
    tableUpdates.push({ range: 'BusinessMetrics!A1', values: [[ 'Month', 'MRR', 'Churn %', 'CAC', 'LTV' ]] })

    // Skills & resources tab
    tableUpdates.push({ range: 'KyNang_TaiLieu!A1', values: [[ 'Skill', 'Best Resource', 'URL', 'Hours/Week' ]] })

    // Fill from structured data if available
    if (structured && typeof structured === 'object') {
      const roadmapRows = Array.isArray(structured.roadmap) ? structured.roadmap : []
      if (roadmapRows.length) {
        tableUpdates.push({
          range: 'Roadmap!A2',
          values: roadmapRows.map((r: any) => [ r.level||'', r.name||'', r.start||'', r.end||'', r.milestone||'', r.kpi||'', r.dependencies||'', r.status||'' ])
        })
      }
      const checklistRows = Array.isArray(structured.checklist) ? structured.checklist : []
      if (checklistRows.length) {
        tableUpdates.push({
          range: 'Checklist!A2',
          values: checklistRows.map((c: any) => [ false, c.time||'', c.action||'', c.link||'' ])
        })
      }
      const skillsRows = Array.isArray(structured.skills) ? structured.skills : []
      if (skillsRows.length) {
        tableUpdates.push({ range: 'KyNang_TaiLieu!A2', values: skillsRows.map((s: any) => [ s.skill||'', s.resource||'', s.url||'', s.hours||'' ]) })
      }
    }

    // Apply batched value updates
    for (const u of tableUpdates) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: u.range,
        valueInputOption: 'RAW',
        requestBody: { values: u.values }
      })
    }

    // Add checkbox validation and simple formatting
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            setDataValidation: {
              range: { sheetId: 0, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
              rule: { condition: { type: 'BOOLEAN' }, strict: true, inputMessage: 'Mark done' }
            }
          },
          {
            addConditionalFormatRule: {
              rule: {
                ranges: [{ sheetId: 0, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 }],
                booleanRule: {
                  condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'Done' }] },
                  format: { backgroundColor: { red: 0.85, green: 0.95, blue: 0.85 } }
                }
              },
              index: 0
            }
          }
        ]
      }
    })

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

// Function to create a Google Docs document with plan content
export const createGoogleDoc = async (plan: any, userId: string) => {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials not configured')
  }

  const auth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ]
  })

  const drive = google.drive({ version: 'v3', auth })

  try {
    // Auto-cleanup: Delete old Google Docs to free up storage (keep last 20 files)
    try {
      const { data: fileList } = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.document' and trashed=false",
        orderBy: 'createdTime desc',
        fields: 'files(id, name, createdTime)',
        pageSize: 100
      })

      if (fileList.files && fileList.files.length > 20) {
        // Delete files beyond the 20 most recent
        const filesToDelete = fileList.files.slice(20)
        for (const file of filesToDelete) {
          try {
            await drive.files.delete({ fileId: file.id! })
          } catch (deleteError) {
            // Ignore delete errors, continue with creation
          }
        }
      }
    } catch (cleanupError) {
      // Ignore cleanup errors, continue with creation
    }

    const title = plan.title || 'Kế hoạch tài chính'
    const content = plan.content || ''
    const createdDate = new Date(plan.created_at).toLocaleDateString('vi-VN')
    const formattedContent = `# ${title}\n\nNgày tạo: ${createdDate}\n\n${content}\n\n---\nĐược tạo bởi PlanAI.io.vn`

    // Create Google Doc via Drive API by uploading as text/plain and converting to Docs
    const { data: file } = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: 'application/vnd.google-apps.document'
      },
      media: {
        mimeType: 'text/plain',
        body: formattedContent
      },
      fields: 'id'
    })

    const documentId = file.id
    if (!documentId) {
      throw new Error('Failed to create Google Doc - no document ID returned')
    }

    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    })

    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`
    return { documentId, documentUrl: docUrl }
  } catch (error) {
    throw new Error(`Failed to create Google Doc: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Function to check if Google Sheets API is configured
// Only requires Service Account credentials - template is optional (can create from scratch)
export const isGoogleSheetsConfigured = (): boolean => {
  return Boolean(GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY)
}
