export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import type { NextRequest } from 'next/server'

const TIMEOUT_MS = 8000

const withTimeout = async (promise: Promise<Response>, ms: number) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort('timeout'), ms)
  try {
    const res = await promise
    return res
  } finally {
    clearTimeout(id)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { urls = [], followGetOnHeadFail = true } = await req.json()
    const list: string[] = Array.isArray(urls) ? urls.slice(0, 30) : []

    const checks = await Promise.allSettled(
      list.map(async (u) => {
        try {
          const head = await withTimeout(
            fetch(u, { method: 'HEAD', redirect: 'follow' }),
            TIMEOUT_MS
          )
          if (head.ok) {
            return { url: u, ok: true, status: head.status, finalUrl: head.url }
          }
          if (!followGetOnHeadFail) {
            return { url: u, ok: false, status: head.status, finalUrl: head.url }
          }
          const get = await withTimeout(
            fetch(u, { method: 'GET', redirect: 'follow' }),
            TIMEOUT_MS
          )
          return { url: u, ok: get.ok, status: get.status, finalUrl: get.url }
        } catch (e: any) {
          return { url: u, ok: false, status: 0, finalUrl: u, error: String(e?.message || e) }
        }
      })
    )

    const results = checks.map((c, i) =>
      c.status === 'fulfilled' ? c.value : { url: list[i], ok: false, status: 0, finalUrl: list[i], error: 'rejected' }
    )

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: String(error?.message || error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
