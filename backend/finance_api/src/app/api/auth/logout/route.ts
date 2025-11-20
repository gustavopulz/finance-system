import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST() {
  // Criamos a resposta padrão
  const res = NextResponse.json({
    success: true,
    message: 'Logout successful',
  });

  // 🧹 Remove o cookie HTTP-only
  res.cookies.set({
    name: 'refresh_token',
    value: '',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0), // faz o cookie expirar imediatamente
  });

  return res;
}
