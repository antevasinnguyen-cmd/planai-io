import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import fs from 'fs'
import path from 'path'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (error) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const tier = (profile?.subscription_tier || 'free') as string
    const allowed = ['basic', 'pro', 'pro_max'].includes(tier)
    if (!allowed) {
      return new NextResponse('Payment Required', { status: 402 })
    }

    const mdPath = path.join(process.cwd(), 'content', 'premium', `${params.id}.md`)
    if (!fs.existsSync(mdPath)) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const text = fs.readFileSync(mdPath, 'utf8')
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (e) {
    return new NextResponse('Server Error', { status: 500 })
  }
}
