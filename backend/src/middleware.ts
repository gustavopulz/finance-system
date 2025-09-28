import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export const config = {
  matcher: '/api/:path*',
  runtime: 'nodejs', // 🚀 força runtime Node em vez de Edge
};

export function middleware(request: NextRequest) {
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
      // 🚨 Sem token nenhum → usuário não autenticado
      return new NextResponse(
        JSON.stringify({ error: 'not_authenticated' }),
        { status: 401 }
      );
    }

    try {
      verifyToken(token); // usa função do /lib/jwt
    } catch (err: any) {
      if (err.message === 'Token expirado') {
        // 🚨 Token existe mas expirou → front deve chamar /user/refresh
        return new NextResponse(
          JSON.stringify({ error: 'token_expired' }),
          { status: 401 }
        );
      }

      // 🚨 Qualquer outro erro → token inválido
      return new NextResponse(
        JSON.stringify({ error: 'invalid_token' }),
        { status: 403 }
      );
    }
  }

  // ✅ Resposta padrão
  return NextResponse.next();
}
