import { NextResponse } from 'next/server';

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const isProd = process.env.NODE_ENV === 'production';

// 🍪 Seta auth e refresh tokens
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string
) {
  response.cookies.set('auth_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'none',
    path: '/',
    maxAge: SEVEN_DAYS, // cookie vive até 7d, mesmo se JWT expirar antes
  });

  if (refreshToken) {
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      path: '/',
      maxAge: SEVEN_DAYS,
    });
  }
}

// ❌ Limpa cookies
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  });
}
