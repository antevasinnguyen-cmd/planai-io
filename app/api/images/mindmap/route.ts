import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getCurrentUser } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mermaid, prompt } = await request.json().catch(() => ({}))

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const basePrompt = `Create a clean, modern roadmap/mindmap style image in dark-on-light theme.
- Vector-like clarity, readable Vietnamese labels.
- Center main goal, branches by năm/quý/tháng, simple nodes and connectors.
${mermaid ? `- Use this Mermaid mindmap as structure guidance (do not render code text):\n${mermaid}` : ''}
${prompt ? `- Extra notes: ${prompt}` : ''}`

    // Retry wrapper for transient network errors
    const runWithRetry = async () => {
      const maxTries = 3
      let lastErr: any
      for (let i = 0; i < maxTries; i++) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 30000)
          const img = await client.images.generate({
            model: 'gpt-image-1',
            prompt: basePrompt,
            size: i === 0 ? '1024x1024' : '512x512',
            style: 'vivid',
          }, { signal: controller.signal as any })
          clearTimeout(timeout)
          return img
        } catch (err: any) {
          lastErr = err
          const msg = String(err?.message || err)
          const isTransient = /connection reset|incomplete envelope|ECONNRESET|fetch failed|network/i.test(msg)
          if (i < maxTries - 1 && isTransient) {
            await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)))
            continue
          }
          throw err
        }
      }
      throw lastErr
    }

    const img = await runWithRetry()

    const b64 = (img as any).data?.[0]?.b64_json
    if (!b64) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 502 })
    }

    return NextResponse.json({ image: `data:image/png;base64,${b64}` })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
