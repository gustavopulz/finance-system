import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await initFirestore();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha obrigatórios' },
        { status: 400 }
      );
    }

    const userSnap = await firestore
      .collection('users')
      .where('email', '==', email)
      .get();

    if (userSnap.empty) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    const ok = await bcrypt.compare(password, userData.password);
    if (!ok) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // 🎫 Gera tokens usando lib/jwt
    const accessToken = generateAccessToken({
      id: userDoc.id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
    });

    const refreshToken = generateRefreshToken({ id: userDoc.id });

    const response = NextResponse.json({
      user: {
        id: userDoc.id,
        name: userData.name,
        role: userData.role,
        email: userData.email,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';

    // Access token (15m)
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutos
    });

    // Refresh token (7d)
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (err) {
    console.error('Erro no login:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
