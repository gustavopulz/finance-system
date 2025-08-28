import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/lib/jwt';
import { initFirestore, firestore } from '@/lib/firestore';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token ausente' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (err: any) {
      if (err.message === 'Token expirado') {
        return NextResponse.json(
          { error: 'refresh_token_expired' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'refresh_token_invalid' },
        { status: 403 }
      );
    }

    // 🔎 Busca usuário no Firestore
    await initFirestore();
    const userDoc = await firestore.collection('users').doc(decoded.id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();

    // 🎫 Gera novo access token com dados atualizados
    const newAccessToken = generateAccessToken({
      id: userDoc.id,
      name: userData?.name,
      role: userData?.role,
      email: userData?.email,
    });

    const response = NextResponse.json({ message: 'Novo token gerado' });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set('auth_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutos
    });

    return response;
  } catch (err) {
    console.error('Erro no refresh:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
