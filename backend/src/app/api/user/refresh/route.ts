// backend: src/app/api/user/refresh/route.ts
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

    // 🔎 Busca usuário atualizado
    await initFirestore();
    const userDoc = await firestore.collection('users').doc(decoded.id).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // 🎫 Novo access token
    const newAccessToken = generateAccessToken({
      id: userDoc.id,
      name: userData?.name,
      role: userData?.role,
      email: userData?.email,
    });

    const isProd = process.env.NODE_ENV === 'production';

    // 🔄 Retorna user completo para atualizar no AuthContext
    const response = NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        name: userData?.name,
        role: userData?.role,
        email: userData?.email,
      },
    });

    // 🔒 Renova cookie
    response.cookies.set('auth_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // ⚡ compatível local/prod
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
