import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export const config = {
  matcher: '/api/:path*',
  runtime: 'nodejs', // 🚀 força runtime Node em vez de Edge
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'https://finance-system.prxlab.app',
    'http://localhost:5173',
  ];
  const allowedOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  // ✅ Preflight (CORS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(allowedOrigin),
    });
  }

  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const pathname = request.nextUrl.pathname.replace(/\/$/, '');

  // ✅ Rotas públicas
  const unprotectedRoutes: string[] = [
    '/api/hello',
    '/api/user/login',
    '/api/user/register',
    '/api/user/refresh',
  ];

  if (isApiRoute && !unprotectedRoutes.includes(pathname)) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'not_authenticated' }), {
        status: 401,
        headers: corsHeaders(allowedOrigin),
      });
    }

    try {
      verifyToken(token); // usa função do /lib/jwt
    } catch (err: any) {
      if (err.message === 'Token expirado') {
        return new NextResponse(JSON.stringify({ error: 'token_expired' }), {
          status: 401,
          headers: corsHeaders(allowedOrigin),
        });
      }

      return new NextResponse(JSON.stringify({ error: 'invalid_token' }), {
        status: 403,
        headers: corsHeaders(allowedOrigin),
      });
    }
  }

  // ✅ Resposta padrão
  const response = NextResponse.next();
  Object.entries(corsHeaders(allowedOrigin)).forEach(([k, v]) =>
    response.headers.set(k, v)
  );
  return response;
}

// 🔧 Função utilitária para headers CORS
function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}