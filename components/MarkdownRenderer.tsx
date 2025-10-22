'use client'

import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Parse markdown and convert to React elements
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // H1 (# )
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-white">
            {line.substring(2)}
          </h1>
        )
        i++
      }
      // H2 (## )
      else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold mt-3 mb-2 text-gray-900 dark:text-white">
            {line.substring(3)}
          </h2>
        )
        i++
      }
      // H3 (### )
      else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-lg font-bold mt-2 mb-1 text-gray-900 dark:text-white">
            {line.substring(4)}
          </h3>
        )
        i++
      }
      // Bold list items (- **text**: description)
      else if (line.startsWith('- **')) {
        const match = line.match(/^- \*\*([^*]+)\*\*:\s*(.*)$/)
        if (match) {
          elements.push(
            <div key={`list-${i}`} className="ml-4 my-1">
              <span className="font-semibold text-gray-900 dark:text-white">{match[1]}:</span>
              <span className="text-gray-700 dark:text-gray-300"> {match[2]}</span>
            </div>
          )
        } else {
          elements.push(
            <div key={`list-${i}`} className="ml-4 my-1 text-gray-700 dark:text-gray-300">
              {line}
            </div>
          )
        }
        i++
      }
      // Regular list items (- text)
      else if (line.startsWith('- ')) {
        elements.push(
          <div key={`list-${i}`} className="ml-4 my-1 text-gray-700 dark:text-gray-300">
            • {line.substring(2)}
          </div>
        )
        i++
      }
      // Numbered list items (1. text, 2. text, etc.)
      else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <div key={`numlist-${i}`} className="ml-4 my-1 text-gray-700 dark:text-gray-300">
            {line}
          </div>
        )
        i++
      }
      // Empty line
      else if (line.trim() === '') {
        elements.push(<div key={`empty-${i}`} className="h-2" />)
        i++
      }
      // Regular paragraph with inline formatting
      else {
        elements.push(
          <p key={`p-${i}`} className="text-gray-700 dark:text-gray-300 my-2 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        )
        i++
      }
    }

    return elements
  }

  // Render inline markdown (bold, italic, code)
  const renderInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Pattern for **bold**, *italic*, and `code`
    const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g
    let match

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      // Add the formatted text
      if (match[1]) {
        // Bold
        parts.push(
          <strong key={`bold-${match.index}`} className="font-semibold text-gray-900 dark:text-white">
            {match[1]}
          </strong>
        )
      } else if (match[2]) {
        // Italic
        parts.push(
          <em key={`italic-${match.index}`} className="italic text-gray-700 dark:text-gray-300">
            {match[2]}
          </em>
        )
      } else if (match[3]) {
        // Code
        parts.push(
          <code
            key={`code-${match.index}`}
            className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-900 dark:text-white"
          >
            {match[3]}
          </code>
        )
      }

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return <div className={`space-y-2 ${className}`}>{parseMarkdown(content)}</div>
}
