import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080'

async function handler(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname
  const search = req.nextUrl.search
  const url = `${BACKEND}${path}${search}`

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value)
    }
  })

  const hasBody = !['GET', 'HEAD'].includes(req.method)

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // @ts-expect-error - duplex required for streaming body in Node.js fetch
    duplex: hasBody ? 'half' : undefined,
  })

  const responseHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    responseHeaders.set(key, value)
  })

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export const GET     = handler
export const POST    = handler
export const PUT     = handler
export const PATCH   = handler
export const DELETE  = handler
export const OPTIONS = handler
