import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export const config = {
  matcher: '/api/:path*',
  runtime: 'nodejs',
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = [
    'https://finance-system.prxlab.app',
    'http://localhost:5173',
  ]
  const allowedOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0]

  // 🔥 Preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(request, allowedOrigin),
    })
  }

  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const pathname = request.nextUrl.pathname.replace(/\/$/, '')

  // Rotas públicas
  const unprotectedRoutes = [
    '/api/hello',
    '/api/user/login',
    '/api/user/register',
    '/api/user/refresh',
  ]

  if (isApiRoute && !unprotectedRoutes.includes(pathname)) {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return jsonResponse({ error: 'not_authenticated' }, 401, request, allowedOrigin)
    }

    try {
      verifyToken(token)
    } catch (err: any) {
      if (err.message === 'Token expirado') {
        return jsonResponse({ error: 'token_expired' }, 401, request, allowedOrigin)
      }
      return jsonResponse({ error: 'invalid_token' }, 403, request, allowedOrigin)
    }
  }

  // ✅ Passa adiante
  const response = NextResponse.next()
  Object.entries(corsHeaders(request, allowedOrigin)).forEach(([k, v]) =>
    response.headers.set(k, v)
  )
  return response
}

// Helpers
function corsHeaders(request: NextRequest, origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      request.headers.get('access-control-request-headers') || '*',
    'Access-Control-Allow-Credentials': 'true',
  }
}

function jsonResponse(body: any, status: number, request: NextRequest, origin: string) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request, origin),
    },
  })
}
