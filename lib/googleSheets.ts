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
    ],
    // Ensure JWT is properly authorized
    projectId: 'planai-473203'
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
    // Ensure JWT is properly authorized
    projectId: 'planai-473203'
  })

  return google.drive({ version: 'v3', auth })
}

// Helper: Aggressively clean up ALL files to free up storage quota
const cleanupAllFiles = async (drive: any): Promise<void> => {
  try {
    console.log('cleanupAllFiles: Starting aggressive cleanup of all files')
    
    // List ALL files (not just spreadsheets), sorted by creation date (oldest first)
    const response = await drive.files.list({
      q: "trashed=false",
      spaces: 'drive',
      fields: 'files(id, name, createdTime, mimeType)',
      pageSize: 1000,
      orderBy: 'createdTime asc',
    } as any)
    
    if (!response.data.files || response.data.files.length === 0) {
      console.log('cleanupAllFiles: No files found')
      return
    }
    
    console.log('cleanupAllFiles: Found', response.data.files.length, 'total files')
    
    // Delete ALL files (including folders) to free up quota
    console.log('cleanupAllFiles: Deleting ALL files to free up quota')
    
    let deletedCount = 0
    for (const file of response.data.files) {
      try {
        await drive.files.delete({ fileId: file.id } as any)
        deletedCount++
        console.log('cleanupAllFiles: Deleted file:', file.name, '(', file.mimeType, ')')
      } catch (deleteError) {
        console.warn('cleanupAllFiles: Failed to delete file:', file.id, deleteError)
        // Continue with next file
      }
    }
    
    console.log('cleanupAllFiles: Cleanup completed, deleted', deletedCount, 'files')
    
    // Also empty trash to completely free up quota
    try {
      console.log('cleanupAllFiles: Emptying trash')
      await drive.files.emptyTrash()
      console.log('cleanupAllFiles: Trash emptied successfully')
    } catch (trashError) {
      console.warn('cleanupAllFiles: Failed to empty trash:', trashError)
    }
  } catch (error) {
    console.warn('cleanupAllFiles: Error during cleanup:', error)
    // Non-critical error - continue anyway
  }
}

// Helper: Get or create a folder for PlanAI spreadsheets
const getOrCreatePlanAIFolder = async (drive: any): Promise<string | null> => {
  try {
    console.log('getOrCreatePlanAIFolder: Checking for existing PlanAI folder')
    
    // Try to find existing folder
    const response = await drive.files.list({
      q: "name='PlanAI Spreadsheets' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 1,
    } as any)
    
    if (response.data.files && response.data.files.length > 0) {
      const folderId = response.data.files[0].id
      console.log('getOrCreatePlanAIFolder: Found existing folder:', folderId)
      return folderId
    }
    
    // Create new folder if not found
    console.log('getOrCreatePlanAIFolder: Creating new PlanAI folder')
    const folderResponse = await drive.files.create({
      requestBody: {
        name: 'PlanAI Spreadsheets',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    } as any)
    
    const folderId = folderResponse.data.id
    console.log('getOrCreatePlanAIFolder: Created new folder:', folderId)
    
    // Make folder public
    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      } as any)
      console.log('getOrCreatePlanAIFolder: Made folder public')
    } catch (permError) {
      console.warn('getOrCreatePlanAIFolder: Failed to make folder public:', permError)
    }
    
    return folderId
  } catch (error) {
    console.warn('getOrCreatePlanAIFolder: Error getting/creating folder:', error)
    return null
  }
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
    
    // Clean up old files to free up storage quota (BLOCKING - must complete before creating new file)
    console.log('createSpreadsheetFromTemplate: Starting cleanup of old files')
    await cleanupAllFiles(drive)
    console.log('createSpreadsheetFromTemplate: Cleanup completed, waiting 2 seconds for quota to update')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Don't create folder - create files directly in root to avoid quota issues
    const folderId = null
    
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
        console.log('createSpreadsheetFromTemplate: Creating new spreadsheet from scratch via Drive API')
        
        // WORKAROUND: Create spreadsheet via Drive API instead of Sheets API
        // This avoids permission issues with Service Account on Sheets API
        const createFileRequest: any = {
          requestBody: {
            name: title,
            mimeType: 'application/vnd.google-apps.spreadsheet',
          },
          fields: 'id',
        }
        
        // Add to folder if available
        if (folderId) {
          createFileRequest.requestBody.parents = [folderId]
        }
        
        console.log('createSpreadsheetFromTemplate: Creating spreadsheet file via Drive API')
        
        let newFile: any = null
        let retryCount = 0
        const maxRetries = 3
        
        // Retry logic in case of quota errors
        while (retryCount < maxRetries && !newFile) {
          try {
            newFile = await drive.files.create(createFileRequest)
          } catch (createFileError: any) {
            retryCount++
            const errorMsg = createFileError?.message || String(createFileError)
            
            if (errorMsg.includes('quota') || errorMsg.includes('storageQuotaExceeded')) {
              console.warn(`createSpreadsheetFromTemplate: Quota error on attempt ${retryCount}/${maxRetries}, retrying...`)
              
              if (retryCount < maxRetries) {
                // Wait before retrying (cleanup might still be running)
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                // Try cleanup again
                console.log('createSpreadsheetFromTemplate: Attempting cleanup again before retry')
                await cleanupAllFiles(drive)
                await new Promise(resolve => setTimeout(resolve, 1000))
              } else {
                throw createFileError
              }
            } else {
              throw createFileError
            }
          }
        }
        
        if (!newFile || !newFile.data || !newFile.data.id) {
          throw new Error('Failed to create new spreadsheet - no ID returned from Drive API')
        }
        
        spreadsheetId = newFile.data.id
        console.log('createSpreadsheetFromTemplate: Created new spreadsheet via Drive API:', spreadsheetId)
        
        // Now populate the spreadsheet with sheets and data
        try {
          console.log('createSpreadsheetFromTemplate: Populating spreadsheet with sheets')
          
          // Add sheets to the spreadsheet
          const batchUpdateRequest: any = {
            requests: [
              // Delete default Sheet0
              { deleteSheet: { sheetId: 0 } },
              // Add our custom sheets
              { addSheet: { properties: { title: 'Overview', sheetId: 1 } } },
              { addSheet: { properties: { title: 'Tóm tắt', sheetId: 2 } } },
              { addSheet: { properties: { title: 'Phân tích', sheetId: 3 } } },
              { addSheet: { properties: { title: 'Lộ trình', sheetId: 4 } } },
              { addSheet: { properties: { title: 'Ngân sách', sheetId: 5 } } },
              { addSheet: { properties: { title: 'Timeline', sheetId: 6 } } },
              { addSheet: { properties: { title: 'Checklist', sheetId: 7 } } },
              { addSheet: { properties: { title: 'Rủi ro', sheetId: 8 } } },
              { addSheet: { properties: { title: 'Lời khuyên', sheetId: 9 } } },
            ]
          }
          
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: batchUpdateRequest,
          } as any)
          
          console.log('createSpreadsheetFromTemplate: Successfully populated spreadsheet with sheets')
        } catch (populateError) {
          console.warn('createSpreadsheetFromTemplate: Failed to populate sheets (non-critical):', populateError)
          // Continue anyway - spreadsheet was created
        }
      } catch (createError) {
        console.error('createSpreadsheetFromTemplate: Error creating spreadsheet:', createError)
        // Log full error details for debugging
        if (createError instanceof Error) {
          console.error('createSpreadsheetFromTemplate: Error message:', createError.message)
          console.error('createSpreadsheetFromTemplate: Error stack:', createError.stack)
          
          // Check if it's a permission error and provide helpful message
          if (createError.message.includes('permission') || createError.message.includes('403')) {
            console.error('createSpreadsheetFromTemplate: PERMISSION_ERROR - Service Account may not have proper access')
          }
        }
        throw new Error(`Failed to create spreadsheet: ${createError instanceof Error ? createError.message : String(createError)}`)
      }
    }

    // CRITICAL: Make the spreadsheet publicly accessible - anyone with link can EDIT
    try {
      console.log('createSpreadsheetFromTemplate: Setting public permissions for spreadsheet:', spreadsheetId)
      
      // First, try to set public permissions
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: 'writer',  // Anyone can edit
            type: 'anyone',  // No login required
          },
        } as any)
        console.log('createSpreadsheetFromTemplate: Set public permissions for spreadsheet:', spreadsheetId)
      } catch (permError) {
        console.warn('createSpreadsheetFromTemplate: Failed to set public permissions, trying with supportsAllDrives:', permError)
        
        // Try with supportsAllDrives flag
        try {
          await drive.permissions.create({
            fileId: spreadsheetId,
            supportsAllDrives: true,
            requestBody: {
              role: 'writer',
              type: 'anyone',
            },
          } as any)
          console.log('createSpreadsheetFromTemplate: Set public permissions with supportsAllDrives:', spreadsheetId)
        } catch (permError2) {
          console.warn('createSpreadsheetFromTemplate: Failed to set public permissions even with supportsAllDrives:', permError2)
          // Non-critical error - spreadsheet was created successfully
        }
      }
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
