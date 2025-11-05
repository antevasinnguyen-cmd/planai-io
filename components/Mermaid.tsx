'use client'

import React, { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' })

interface MermaidProps {
  chart: string
  className?: string
}

export default function Mermaid({ chart, className = '' }: MermaidProps) {
  const id = useId().replace(/[:]/g, '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const render = async () => {
      try {
        setError(null)
        const { svg } = await mermaid.render(`m-${id}`, chart)
        const el = document.getElementById(`m-${id}`)
        if (el && mounted) {
          el.innerHTML = svg
        }
      } catch (e: any) {
        setError(String(e?.message || e))
      }
    }
    render()
    return () => {
      mounted = false
    }
  }, [chart, id])

  if (!chart?.trim()) return null

  return (
    <div className={`mermaid-container my-4 overflow-x-auto ${className}`}>
      {error ? (
        <pre className="text-red-600 text-sm bg-red-50 p-3 rounded">Mermaid error: {error}</pre>
      ) : (
        <div id={`m-${id}`} />
      )}
    </div>
  )
}
