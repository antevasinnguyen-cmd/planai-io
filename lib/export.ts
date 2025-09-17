import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export interface ExportOptions {
  title: string
  content: string
  format: 'pdf' | 'docx' | 'txt' | 'notion' | 'sheets'
  userId?: string
}

export const exportToPDF = async (options: ExportOptions): Promise<Blob> => {
  const pdf = new jsPDF()
  const { title, content } = options
  
  // Set font
  pdf.setFont('helvetica')
  
  // Title
  pdf.setFontSize(20)
  pdf.text(title, 20, 30)
  
  // Content
  pdf.setFontSize(12)
  const lines = pdf.splitTextToSize(content, 170)
  pdf.text(lines, 20, 50)
  
  return pdf.output('blob')
}

export const exportToWord = async (options: ExportOptions): Promise<Blob> => {
  const { title, content } = options
  
  // Parse content into paragraphs
  const paragraphs = content.split('\n').map(line => {
    if (line.startsWith('#')) {
      // Handle headings
      const level = line.match(/^#+/)?.[0].length || 1
      const text = line.replace(/^#+\s*/, '')
      return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 28 - (level * 2) })],
        heading: level === 1 ? HeadingLevel.HEADING_1 : 
                level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
      })
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text
      const text = line.replace(/\*\*/g, '')
      return new Paragraph({
        children: [new TextRun({ text, bold: true })]
      })
    } else if (line.startsWith('- ')) {
      // List items
      const text = line.replace(/^- /, '')
      return new Paragraph({
        children: [new TextRun({ text: `• ${text}` })]
      })
    } else {
      // Regular paragraph
      return new Paragraph({
        children: [new TextRun(line)]
      })
    }
  })

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 32 })],
          heading: HeadingLevel.TITLE
        }),
        ...paragraphs
      ]
    }]
  })

  return await Packer.toBlob(doc)
}

export const exportToText = (options: ExportOptions): Blob => {
  const { title, content } = options
  const fullContent = `${title}\n${'='.repeat(title.length)}\n\n${content}`
  return new Blob([fullContent], { type: 'text/plain' })
}

export const generateNotionBlocks = (content: string) => {
  const lines = content.split('\n')
  const blocks = []

  for (const line of lines) {
    if (line.trim() === '') continue

    if (line.startsWith('#')) {
      // Heading
      const level = line.match(/^#+/)?.[0].length || 1
      const text = line.replace(/^#+\s*/, '')
      blocks.push({
        object: 'block',
        type: `heading_${level}`,
        [`heading_${level}`]: {
          rich_text: [{ type: 'text', text: { content: text } }]
        }
      })
    } else if (line.startsWith('- ')) {
      // Bullet list
      const text = line.replace(/^- /, '')
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: text } }]
        }
      })
    } else {
      // Paragraph
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
}

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
