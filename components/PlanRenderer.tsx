'use client'

import { useState, useMemo } from 'react'
import { Copy, Download, Table2, FileSpreadsheet, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'

interface TableData {
  headers: string[]
  rows: string[][]
}

interface PlanRendererProps {
  content: string
  planId?: string
  onExport?: (format: string) => void
  userTier?: string
}

export default function PlanRenderer({ content, planId, onExport, userTier = 'free' }: PlanRendererProps) {
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [showFloatingCTA, setShowFloatingCTA] = useState(true)

  // Strip JSON Data Layer from content (hide from user)
  const cleanContent = useMemo(() => {
    // Remove JSON block at end of content (Data Layer for export only)
    const jsonBlockRegex = /```json\s*\{[\s\S]*?\}\s*```\s*$/
    return content.replace(jsonBlockRegex, '').trim()
  }, [content])

  // Auto-fix markdown tables: add separator row if missing + remove visible truncation markers
  const fixedContent = useMemo(() => {
    let fixed = cleanContent
    // Add separator row if missing
    const missingSeparatorRegex = /(^\|(?:[^|\n]+\|)+\s*$)\n(?!^\|[-\s|:]+\|$)(^\|(?:[^|\n]+\|)+\s*$)/gm
    fixed = fixed.replace(missingSeparatorRegex, (_m, headerLine, firstDataLine) => {
      const headerCells = headerLine.split('|').filter(c => c.trim().length > 0)
      const colCount = headerCells.length
      const separator = '|' + Array(colCount).fill('---').join('|') + '|'
      return `${headerLine}\n${separator}\n${firstDataLine}`
    })
    // Remove placeholder ellipsis in content to avoid rendering '...'
    fixed = fixed.replace(/\n?\s*\.\.\.(?=\s|\n)/g, '')
    fixed = fixed.replace(/\n?\s*…(?=\s|\n)/g, '')
    return fixed
  }, [cleanContent])

  // Parse tables from markdown content - FULL DATA, NO TRUNCATION
  const extractTables = (text: string): { content: string; tables: Map<string, TableData> } => {
    const tables = new Map<string, TableData>()
    let processedContent = text
    let tableIndex = 0

    // Regex to find markdown tables - capture ALL content
    const tableRegex = /\|(.+)\n\|[-\s|:]+\n((?:\|.+\n?)*)/g
    let match

    while ((match = tableRegex.exec(text)) !== null) {
      const headerRow = match[1].split('|').map(cell => cell.trim()).filter(c => c.length > 0)
      const bodyText = match[2].trim()
      const bodyRows = bodyText.split('\n')
        .filter(row => row.trim().length > 0)
        .map(row => {
          const cells = row.split('|').map(cell => cell.trim()).filter(c => c.length > 0)
          // Ensure all rows have same column count as header
          while (cells.length < headerRow.length) {
            cells.push('')
          }
          return cells.slice(0, headerRow.length)
        })

      const tableId = `table-${tableIndex}`
      tables.set(tableId, {
        headers: headerRow,
        rows: bodyRows
      })

      tableIndex++
    }

    return { content: processedContent, tables }
  }

  const { tables } = extractTables(fixedContent)

  const handleCopyTable = (tableId: string) => {
    const table = tables.get(tableId)
    if (!table) return

    const sanitize = (v: any) => String(v ?? '').trim().replace(/^(-{3,}|\.{3}|…)$/g, '')
    const csvContent = [
      table.headers.map(sanitize).join('\t'),
      ...table.rows.map(row => row.map(sanitize).join('\t'))
    ].join('\n')

    navigator.clipboard.writeText(csvContent)
    setCopiedTableId(tableId)
    setTimeout(() => setCopiedTableId(null), 2000)
  }

  const handleExportTable = (tableId: string) => {
    const table = tables.get(tableId)
    if (!table) return

    // Ensure all rows have same number of columns as headers
    const maxCols = table.headers.length
    const normalizedRows = table.rows.map(row => {
      const normalizedRow = [...row]
      while (normalizedRow.length < maxCols) {
        normalizedRow.push('')
      }
      return normalizedRow.slice(0, maxCols)
    })

    const sanitize = (v: any) => String(v ?? '').trim().replace(/^(-{3,}|\.{3}|…)$/g, '')
    const csvContent = [
      table.headers.map(h => `"${sanitize(h).replace(/"/g, '""')}"`).join(','),
      ...normalizedRows.map(row => 
        row.map(cell => `"${sanitize(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    // Add UTF-8 BOM for proper encoding
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${tableId}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleTableExpand = (tableId: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId)
    } else {
      newExpanded.add(tableId)
    }
    setExpandedTables(newExpanded)
  }

  // Extract CTA section for special rendering (match regardless of leading emoji)
  const ctaRegex = /NÂNG CẤP GÓI TRẢ PHÍ NGAY[\s\S]*?(?=##|$)/
  const ctaMatch = fixedContent.match(ctaRegex)
  const ctaContent = ctaMatch ? ctaMatch[0] : null
  const mainContent = ctaContent ? fixedContent.replace(ctaRegex, '') : fixedContent

  // Sanitize legacy content: remove placeholder tokens like [X%], [Y tỷ], and defaulted fabricated fields
  const sanitizedMain = useMemo(() => {
    let t = mainContent
    // Replace bracket placeholders [X], [Y], [Z] with a neutral note
    t = t.replace(/\[(?:X|Y|Z)[^\]]*\]/g, '(Không đủ dữ liệu)')
    // Replace ': true' values
    t = t.replace(/:\s*true\b/gi, ': Chưa cung cấp')
    // Common defaulted phrases -> neutralize
    t = t.replace(/Độ tuổi[^:]*:\s*25-35[^\n]*/gi, 'Độ tuổi: Chưa cung cấp')
    t = t.replace(/Nghề nghiệp[^:]*:\s*Nhân viên văn phòng/gi, 'Nghề nghiệp: Chưa cung cấp')
    return t
  }, [mainContent])

  return (
    <div className="w-full relative">
      {/* Floating CTA Button - Only for FREE tier */}
      {userTier === 'free' && showFloatingCTA && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <a
            href="/pricing"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105"
          >
            <span className="text-2xl">🚀</span>
            <span className="font-bold">Nâng cấp Premium</span>
          </a>
          <button
            onClick={() => setShowFloatingCTA(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full text-xs hover:bg-gray-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* CTA sẽ được render ở cuối component */}

      {/* Main Content with Ebook Style */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-8 
        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-purple-500
        prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-purple-600 dark:prose-h2:text-purple-400
        prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-800 dark:prose-h3:text-gray-200
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-base
        prose-li:text-gray-700 dark:prose-li:text-gray-300
        prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
        prose-ul:list-disc prose-ul:pl-6
        prose-ol:list-decimal prose-ol:pl-6
        prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic
        prose-code:bg-purple-50 dark:prose-code:bg-purple-900/30 prose-code:text-purple-700 dark:prose-code:text-purple-300 prose-code:px-2 prose-code:py-1 prose-code:rounded
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="my-6 overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {children}
              </tbody>
            ),
            th: ({ children }) => {
              const text = String(Array.isArray(children) ? children.join('') : children).trim()
              const isPlaceholder = /^(-{3,}|\.{3}|…)$/.test(text)
              return (
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  {isPlaceholder ? '' : children}
                </th>
              )
            },
            td: ({ children }) => {
              const text = String(Array.isArray(children) ? children.join('') : children).trim()
              const isPlaceholder = /^(-{3,}|\.{3}|…)$/.test(text)
              return (
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {isPlaceholder ? '' : children}
                </td>
              )
            },
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '')
              const lang = match ? match[1] : ''
              
              // Render mermaid diagrams
              if (lang === 'mermaid' && !inline) {
                return (
                  <MermaidDiagram code={String(children).replace(/\n$/, '')} />
                )
              }
              
              // Default code block
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        >
          {sanitizedMain}
        </ReactMarkdown>
      </div>

      {/* Table Export Cards */}
      {tables.size > 0 && (
        <div className="mt-12 space-y-4">
          <div className="flex items-center space-x-2 mb-6">
            <Table2 className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Xuất Dữ Liệu Bảng
            </h3>
          </div>

          {Array.from(tables.entries()).map(([tableId, table], index) => (
            <div
              key={tableId}
              className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
            >
              {/* Table Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Bảng {index + 1}: {table.headers.join(' • ')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {table.rows.length} hàng dữ liệu
                  </p>
                </div>
                <button
                  onClick={() => toggleTableExpand(tableId)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={expandedTables.has(tableId) ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'}
                    />
                  </svg>
                </button>
              </div>

              {/* Expanded Table Preview */}
              {expandedTables.has(tableId) && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#0f0f0f] overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {table.headers.map((header, i) => (
                          <th
                            key={i}
                            className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="px-3 py-2 text-gray-700 dark:text-gray-300"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {table.rows.length > 5 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      ... và {table.rows.length - 5} hàng khác
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#0f0f0f] border-t border-gray-200 dark:border-gray-800 flex items-center space-x-3">
                <button
                  onClick={() => handleCopyTable(tableId)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {copiedTableId === tableId ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép dữ liệu</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExportTable(tableId)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất CSV</span>
                </button>

                {userTier !== 'free' && (
                  <button
                    onClick={() => onExport?.('sheets')}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Google Sheets</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export All Button */}
      {tables.size > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Xuất Toàn Bộ Dữ Liệu
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Xuất tất cả {tables.size} bảng sang Google Sheets hoặc Excel
              </p>
            </div>
            {userTier !== 'free' && (
              <button
                onClick={() => onExport?.('sheets')}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>Xuất Tất Cả</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Beautiful CTA Section - Only for FREE tier - moved to absolute bottom */}
      {userTier === 'free' && (
        <div className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-[2px]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl animate-pulse">
                🎯
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Nâng cấp để mở khóa đầy đủ tính năng
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Khi bạn sẵn sàng, hãy nâng cấp để có phân tích sâu hơn và công cụ quản trị thực tế.
              </p>
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
                {[
                  '✅ 24 phần phân tích chi tiết',
                  '✅ Google Sheets theo dõi tự động',
                  '✅ 3–5 mô hình kinh doanh cá nhân hóa',
                  '✅ Dự báo và chiến lược rủi ro'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-105"
                >
                  <span>🚀</span>
                  <span>Nâng cấp ngay</span>
                </a>
                <a
                  href="/dashboard/subscription"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  <span>ℹ️</span>
                  <span>Xem chi tiết gói</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mermaid diagram renderer component
function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [img, setImg] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [genErr, setGenErr] = useState<string>('')

  useMemo(() => {
    const renderMermaid = async () => {
      try {
        mermaid.initialize({ startOnLoad: true, theme: 'default' })
        const { svg: renderedSvg } = await mermaid.render('mermaid-diagram', code)
        setSvg(renderedSvg)
        setError('')
      } catch (err) {
        setError('Không thể render sơ đồ')
        console.error('Mermaid render error:', err)
      }
    }
    renderMermaid()
  }, [code])

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
          {code}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="my-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="my-6 p-4 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
      <div dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center" />
      <div className="mt-4">
        <button
          onClick={async () => {
            try {
              setLoading(true)
              setGenErr('')
              setImg('')
              const res = await fetch('/api/images/mindmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ mermaid: code })
              })
              const data = await res.json().catch(() => ({}))
              if (!res.ok || data?.error) {
                throw new Error(data?.error || `HTTP ${res.status}`)
              }
              setImg(data?.image || '')
            } catch (e) {
              setGenErr('Không thể tạo ảnh. Vui lòng thử lại.')
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            loading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {loading ? 'Đang tạo ảnh...' : 'Tạo ảnh minh họa (AI)'}
        </button>
        {genErr && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{genErr}</p>
        )}
        {img && (
          <div className="mt-4">
            <img src={img} alt="Mindmap" className="max-w-full h-auto rounded border border-gray-200 dark:border-gray-700" />
            <div className="mt-2">
              <a
                href={img}
                download={`mindmap-${Date.now()}.png`}
                className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              >
                Tải ảnh
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
