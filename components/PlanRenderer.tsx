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
  const [exportingTable, setExportingTable] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [showFloatingCTA, setShowFloatingCTA] = useState(true)

  // Strip JSON Data Layer from content (hide from user)
  const cleanContent = useMemo(() => {
    // Remove JSON block at end of content (Data Layer for export only) - only if truly at the end
    const jsonBlockRegex = /```json\s*\{[\s\S]*?\}\s*```\s*$/
    let cleaned = content;
    const match = cleaned.match(jsonBlockRegex);
    if (match && match.index !== undefined) {
      // Only cut if nothing but whitespace after JSON block
      const after = cleaned.slice(match.index + match[0].length);
      if (!after.trim()) {
        cleaned = cleaned.slice(0, match.index).trim();
      }
    }
    return cleaned;
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

  // --- PHÂN TÁCH SECTION & RENDER THEO QUYỀN ---
  const sectionRegex = /(^|\n)(##\s*Phần\s*\d+[^\n]*)/g;
  const splitSections = (text: string) => {
    const result: { title: string, content: string, index: number }[] = [];
    let match;
    let lastIndex = 0;
    let sectionIdx = 0;
    const matches = [...text.matchAll(sectionRegex)];
    if (matches.length === 0) {
      // Không có section rõ ràng, trả về nguyên content
      return [{ title: '', content: text, index: 0 }];
    }
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const title = matches[i][2];
      const next = matches[i + 1]?.index ?? text.length;
      if (start > lastIndex) {
        // Đoạn đầu trước section đầu tiên
        result.push({ title: '', content: text.slice(lastIndex, start), index: sectionIdx++ });
      }
      result.push({ title, content: text.slice(start, next), index: sectionIdx++ });
      lastIndex = next;
    }
    if (lastIndex < text.length) {
      result.push({ title: '', content: text.slice(lastIndex), index: sectionIdx++ });
    }
    return result;
  };

  const sections = useMemo(() => splitSections(mainContent), [mainContent]);

  // Helper: lấy số phần từ tiêu đề
  const getSectionNumber = (title: string) => {
    const m = title.match(/Phần\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  };

  // Render từng section
  const renderSection = (section: { title: string, content: string, index: number }) => {
    const sn = getSectionNumber(section.title);
    if (userTier !== 'free' || !sn || [1,2,3,8,9].includes(sn)) {
      // Paid hoặc các phần được xem full
      return (
        <div key={section.index} className="mb-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
        </div>
      );
    } else if ([4,5,6,7].includes(sn)) {
      // Chỉ hiển thị 60% đầu, phần còn lại làm mờ + CTA
      const lines = section.content.split('\n');
      const cutoff = Math.max(1, Math.floor(lines.length * 0.6));
      const visible = lines.slice(0, cutoff).join('\n');
      const hidden = lines.slice(cutoff).join('\n');
      return (
        <div key={section.index} className="mb-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{visible}</ReactMarkdown>
          {hidden && (
            <div className="relative mt-2">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-200/80 dark:from-gray-900/80 to-transparent pointer-events-none" style={{backdropFilter:'blur(2px)'}} />
              <div className="blur-sm select-none text-gray-400 dark:text-gray-600 whitespace-pre-line" aria-hidden>{hidden}</div>
              <div className="flex justify-center mt-4">
                <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-base hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-105">
                  <span>🚀</span>
                  <span>Nâng cấp bản trả phí ngay để xem kế hoạch chuyên sâu hoàn chỉnh</span>
                </a>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Các section khác (không xác định): render bình thường
      return (
        <div key={section.index} className="mb-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content.replace('Sử dụng tính năng tử vi, thần số học cá nhân hoá', '* Sử dụng tính năng tử vi, thần số học cá nhân hoá')}</ReactMarkdown>
        </div>
      );
    }
  };

  // --- RETURN CHÍNH CỦA COMPONENT ---
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

      {/* Main Content with Ebook Style */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-8 
        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-purple-500
        prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-purple-600 dark:prose-h2:text-purple-400
        prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-800 dark:prose-h3:text-gray-200
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-base prose-p:whitespace-normal prose-p:break-words prose-p:overflow-wrap-anywhere prose-p:overflow-hidden prose-p:max-w-full
        prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:whitespace-normal prose-li:break-words prose-li:overflow-wrap-anywhere prose-li:overflow-hidden
        prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
        prose-ul:list-disc prose-ul:pl-6
        prose-ol:list-decimal prose-ol:pl-6
        prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic
        prose-code:bg-purple-50 dark:prose-code:bg-purple-900/30 prose-code:text-purple-700 dark:prose-code:text-purple-300 prose-code:px-2 prose-code:py-1 prose-code:rounded
      ">
        {sections.map(section => renderSection(section))}
      </div>

      {/* Các phần Table Export Cards, CTA, ... giữ nguyên như cũ nếu có */}
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
