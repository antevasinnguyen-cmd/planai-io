/**
 * Utility functions to extract and format tables from plan content
 */

export interface TableData {
  id: string
  title: string
  description?: string
  headers: string[]
  rows: (string | number)[][]
}

/**
 * Extract structured data from plan content and convert to tables
 */
export function extractTablesFromPlan(content: string): TableData[] {
  const tables: TableData[] = []
  let tableIndex = 0

  // Pattern 1: Markdown tables
  const markdownTableRegex = /\|(.+)\n\|[-\s|:]+\n((?:\|.+\n?)*)/g
  let match

  while ((match = markdownTableRegex.exec(content)) !== null) {
    const headerRow = match[1]
      .split('|')
      .map(cell => cell.trim())
      .filter(Boolean)
    const bodyRows = match[2]
      .trim()
      .split('\n')
      .map(row =>
        row
          .split('|')
          .map(cell => cell.trim())
          .filter(Boolean)
      )

    if (headerRow.length > 0 && bodyRows.length > 0) {
      tables.push({
        id: `table-${tableIndex}`,
        title: `Bảng ${tableIndex + 1}`,
        headers: headerRow,
        rows: bodyRows
      })
      tableIndex++
    }
  }

  // Pattern 2: Structured data with headers (e.g., "### Năm 1:" followed by bullet points)
  const structuredDataRegex = /###\s+(.+?)\n((?:\s*[-•*]\s+.+\n?)+)/g
  while ((match = structuredDataRegex.exec(content)) !== null) {
    const title = match[1].trim()
    const lines = match[2]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s+/, '').trim())

    if (lines.length > 0) {
      // Convert bullet points to table rows
      const rows = lines.map(line => {
        const parts = line.split(':')
        return parts.length > 1
          ? [parts[0].trim(), parts.slice(1).join(':').trim()]
          : [line, '']
      })

      tables.push({
        id: `table-${tableIndex}`,
        title: title,
        headers: ['Tiêu chí', 'Chi tiết'],
        rows: rows
      })
      tableIndex++
    }
  }

  return tables
}

/**
 * Convert table data to CSV format
 */
export function tableToCSV(table: TableData): string {
  const headers = table.headers.join(',')
  const rows = table.rows
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  return `${headers}\n${rows}`
}

/**
 * Convert table data to TSV format (for clipboard)
 */
export function tableToTSV(table: TableData): string {
  const headers = table.headers.join('\t')
  const rows = table.rows.map(row => row.join('\t')).join('\n')
  return `${headers}\n${rows}`
}

/**
 * Convert multiple tables to a single CSV file
 */
export function tablesToCSV(tables: TableData[]): string {
  return tables
    .map((table, index) => {
      const header = `\n# ${table.title}\n`
      return header + tableToCSV(table)
    })
    .join('\n\n')
}

/**
 * Generate Google Sheets import format
 */
export function tableToGoogleSheetsFormat(table: TableData): string {
  const headers = table.headers.join('\t')
  const rows = table.rows.map(row => row.join('\t')).join('\n')
  return `${headers}\n${rows}`
}

/**
 * Extract financial metrics from plan content
 */
export function extractFinancialMetrics(content: string) {
  const metrics: Record<string, any> = {}

  // Extract income targets
  const incomeRegex = /(?:mục tiêu|target|thu nhập).*?(\d+[\s,]*(?:triệu|tỷ|tỷ đồng|triệu đồng))/gi
  let match
  while ((match = incomeRegex.exec(content)) !== null) {
    metrics.incomeTargets = metrics.incomeTargets || []
    metrics.incomeTargets.push(match[1])
  }

  // Extract timelines
  const timelineRegex = /(?:năm|tháng|quý).*?(\d+)\s*(?:năm|tháng|quý)/gi
  while ((match = timelineRegex.exec(content)) !== null) {
    metrics.timelines = metrics.timelines || []
    metrics.timelines.push(match[1])
  }

  return metrics
}

/**
 * Create a summary table from plan metrics
 */
export function createSummaryTable(content: string): TableData {
  const metrics = extractFinancialMetrics(content)

  return {
    id: 'summary-table',
    title: 'Tóm Tắt Kế Hoạch',
    description: 'Các chỉ số chính của kế hoạch tài chính',
    headers: ['Chỉ Số', 'Giá Trị'],
    rows: [
      ['Mục tiêu thu nhập', metrics.incomeTargets?.[0] || 'N/A'],
      ['Thời gian thực hiện', `${metrics.timelines?.[0] || 'N/A'} năm`],
      ['Số lượng giai đoạn', metrics.timelines?.length?.toString() || 'N/A'],
      ['Ngày tạo', new Date().toLocaleDateString('vi-VN')]
    ]
  }
}

/**
 * Format table for display in UI
 */
export function formatTableForDisplay(table: TableData): TableData {
  return {
    ...table,
    rows: table.rows.map(row =>
      row.map(cell =>
        typeof cell === 'string'
          ? cell.length > 100
            ? cell.substring(0, 100) + '...'
            : cell
          : cell
      )
    )
  }
}
