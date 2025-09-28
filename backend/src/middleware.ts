// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export const config = {
  matcher: '/api/:path*',
  runtime: 'nodejs',
}

// 🔧 Função utilitária para headers CORS
function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// 🔧 Helper para respostas já com CORS
function withCors(
  body: any,
  status: number,
  origin: string
): NextResponse {
  return new NextResponse(
    body ? JSON.stringify(body) : null,
    {
      status,
      headers: corsHeaders(origin),
    }
  )
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

  // ✅ Preflight (CORS)
  if (request.method === 'OPTIONS') {
    return withCors(null, 204, allowedOrigin)
  }

  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const pathname = request.nextUrl.pathname.replace(/\/$/, '')

  // ✅ Rotas públicas
  const unprotectedRoutes: string[] = [
    '/api/hello',
    '/api/user/login',
    '/api/user/register',
    '/api/user/refresh',
  ]

  if (isApiRoute && !unprotectedRoutes.includes(pathname)) {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return withCors({ error: 'not_authenticated' }, 401, allowedOrigin)
    }

    try {
      verifyToken(token)
    } catch (err: any) {
      if (err.message === 'Token expirado') {
        return withCors({ error: 'token_expired' }, 401, allowedOrigin)
      }
      return withCors({ error: 'invalid_token' }, 403, allowedOrigin)
    }
  }

  // ✅ Resposta padrão
  const response = NextResponse.next()
  Object.entries(corsHeaders(allowedOrigin)).forEach(([k, v]) =>
    response.headers.set(k, v)
  )
  return response
}
