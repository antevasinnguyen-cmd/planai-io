import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const getOAuth2Client = () => {
  return new OAuth2Client(
    process.env.GOOGLE_SHEETS_CLIENT_ID,
    process.env.GOOGLE_SHEETS_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
  );
};

/**
 * Export financial plan to Google Sheets
 * @param title Plan title
 * @param content Plan content in structured format
 * @param refreshToken User's Google refresh token
 * @returns URL to the created spreadsheet
 */
export async function exportToGoogleSheets(
  title: string,
  content: any,
  refreshToken: string
): Promise<string> {
  try {
    // Create OAuth2 client
    const oauth2Client = getOAuth2Client();
    
    // Set credentials using refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Create Google Sheets client
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Parse tables from markdown content
    const tables = parseMarkdownTables(typeof content === 'string' ? content : JSON.stringify(content));
    
    // Create sheets array with parsed tables
    const sheetsList = [
      {
        properties: {
          title: 'Overview',
          gridProperties: {
            rowCount: 1000,
            columnCount: 26
          }
        }
      }
    ];

    // Add sheets for each parsed table
    for (const table of tables) {
      sheetsList.push({
        properties: {
          title: table.name,
          gridProperties: {
            rowCount: Math.max(100, table.rows.length + 5),
            columnCount: table.headers.length
          }
        }
      });
    }

    // Create a new spreadsheet with all sheets
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `PlanAI: ${title} - ${new Date().toLocaleDateString()}`
        },
        sheets: sheetsList
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet');
    }

    // Update Overview sheet with main data
    const sheetData = prepareSheetData(content);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Overview!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: sheetData
      }
    });

    // Update each table sheet
    for (const table of tables) {
      const sheetValues = [
        table.headers,
        ...table.rows
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${table.name}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: sheetValues
        }
      });
    }

    // Format the spreadsheet
    await formatSpreadsheet(sheets, spreadsheetId);

    // Return the URL to the spreadsheet
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  } catch (error) {
    console.error('Google Sheets export error:', error);
    throw new Error('Failed to export to Google Sheets');
  }
}

/**
 * Parse markdown tables from plan content
 */
function parseMarkdownTables(content: string): { name: string; headers: string[]; rows: string[][] }[] {
  const tables: { name: string; headers: string[]; rows: string[][] }[] = [];
  
  // Split content by sections
  const sections = content.split(/^##\s+/m);
  
  for (const section of sections) {
    // Find section title
    const titleMatch = section.match(/^(.+?)(?:\n|$)/);
    const sectionTitle = titleMatch ? titleMatch[1].trim().slice(0, 31) : 'Sheet';
    
    // Find markdown tables in this section
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
    let match;
    
    while ((match = tableRegex.exec(section)) !== null) {
      const headerRow = match[1].split('|').map(cell => cell.trim()).filter(Boolean);
      const bodyRows = match[2].trim().split('\n').map(row => 
        row.split('|').map(cell => cell.trim()).filter(Boolean)
      );
      
      // Skip rows with only "---" placeholders
      const cleanRows = bodyRows.filter(row => 
        !row.every(cell => /^-{2,}$/.test(cell) || cell === '')
      );
      
      if (headerRow.length > 0 && cleanRows.length > 0) {
        tables.push({
          name: sectionTitle.replace(/[\\\/\?\*\[\]]/g, '').slice(0, 31),
          headers: headerRow,
          rows: cleanRows
        });
      }
    }
  }
  
  return tables;
}

/**
 * Prepare data for Google Sheets
 */
function prepareSheetData(content: any): any[][] {
  // Header row
  const data: any[][] = [
    ['PlanAI - Financial Plan', '', '', '', ''],
    ['', '', '', '', ''],
    ['Plan Overview', '', '', '', '']
  ];

  // Add plan sections
  if (content.summary) {
    data.push(['Summary', '', '', '', '']);
    data.push([content.summary, '', '', '', '']);
    data.push(['', '', '', '', '']);
  }

  if (content.goals) {
    data.push(['Financial Goals', '', '', '', '']);
    if (Array.isArray(content.goals)) {
      content.goals.forEach((goal: any, index: number) => {
        data.push([`${index + 1}. ${goal}`, '', '', '', '']);
      });
    } else {
      data.push([content.goals, '', '', '', '']);
    }
    data.push(['', '', '', '', '']);
  }

  if (content.strategies) {
    data.push(['Strategies', '', '', '', '']);
    if (typeof content.strategies === 'object') {
      Object.entries(content.strategies).forEach(([key, value]) => {
        data.push([key, '', '', '', '']);
        data.push([value, '', '', '', '']);
      });
    } else if (Array.isArray(content.strategies)) {
      content.strategies.forEach((strategy: any, index: number) => {
        data.push([`${index + 1}. ${strategy}`, '', '', '', '']);
      });
    } else {
      data.push([content.strategies, '', '', '', '']);
    }
    data.push(['', '', '', '', '']);
  }

  if (content.timeline) {
    data.push(['Timeline', '', '', '', '']);
    if (typeof content.timeline === 'object') {
      Object.entries(content.timeline).forEach(([key, value]) => {
        data.push([key, value, '', '', '']);
      });
    } else {
      data.push([content.timeline, '', '', '', '']);
    }
    data.push(['', '', '', '', '']);
  }

  if (content.budget) {
    data.push(['Budget', '', '', '', '']);
    if (typeof content.budget === 'object') {
      Object.entries(content.budget).forEach(([key, value]) => {
        data.push([key, value, '', '', '']);
      });
    } else {
      data.push([content.budget, '', '', '', '']);
    }
    data.push(['', '', '', '', '']);
  }

  return data;
}

/**
 * Format the spreadsheet
 */
async function formatSpreadsheet(sheets: any, spreadsheetId: string): Promise<void> {
  try {
    // Format header
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 5
              },
              rows: [
                {
                  values: [
                    {
                      userEnteredFormat: {
                        backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                        textFormat: {
                          fontSize: 14,
                          bold: true,
                          foregroundColor: { red: 1, green: 1, blue: 1 }
                        },
                        horizontalAlignment: 'CENTER',
                        verticalAlignment: 'MIDDLE'
                      }
                    }
                  ]
                }
              ],
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
            }
          },
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 5
              },
              properties: {
                pixelSize: 200
              },
              fields: 'pixelSize'
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Spreadsheet formatting error:', error);
  }
}

/**
 * Get OAuth URL for Google Sheets authorization
 */
export function getGoogleSheetsAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ];

  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

/**
 * Exchange authorization code for refresh token
 */
export async function getGoogleSheetsRefreshToken(code: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens.refresh_token || '';
}
