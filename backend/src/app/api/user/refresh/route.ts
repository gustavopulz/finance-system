import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token ausente' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (err: any) {
      if (err.message === 'Token expirado') {
        return NextResponse.json({ error: 'refresh_token_expired' }, { status: 401 });
      }
      return NextResponse.json({ error: 'refresh_token_invalid' }, { status: 403 });
    }

    // 🎫 Gera novo access token
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email,
    });

    const response = NextResponse.json({ message: 'Novo token gerado' });
    response.cookies.set('auth_token', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 15,
    });

    return response;
  } catch (err) {
    console.error('Erro no refresh:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
