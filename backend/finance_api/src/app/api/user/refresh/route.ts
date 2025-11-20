import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/lib/jwt';
import { getUserFromFirestore } from '@/lib/users';
import { setAuthCookies } from '@/lib/authCookies';

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

    const userData = await getUserFromFirestore(decoded.id);
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const newAccessToken = generateAccessToken({
      id: userData.id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        role: userData.role,
        email: userData.email,
      },
    });

    setAuthCookies(response, newAccessToken);
    return response;
  } catch (err) {
    console.error('Erro no refresh:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
