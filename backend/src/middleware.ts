import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'https://finance-system.prxlab.app',
    'http://localhost:5173',
  ];
  const allowedOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  // ✅ Tratamento de preflight (CORS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // ✅ Autenticação somente para /api/*
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const pathname = request.nextUrl.pathname.replace(/\/$/, ''); // remove barra final

  // ✅ Rotas sem autenticação
  const unprotectedRoutes: string[] = [
    '/api/user/login',
    '/api/hello'
  ];

  if (isApiRoute && !unprotectedRoutes.includes(pathname)) {
    const cookie = request.cookies.get('auth_token');
    const token = typeof cookie === 'string' ? cookie : cookie?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Não autenticado: middleware' }),
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods':
              'GET,POST,PATCH,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    }
  }

  // ✅ Resposta padrão
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,PUT,DELETE,OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
