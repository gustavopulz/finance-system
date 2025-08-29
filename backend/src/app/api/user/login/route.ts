import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { setAuthCookies } from '@/lib/authCookies';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await initFirestore();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    const userSnap = await firestore.collection('users').where('email', '==', email).get();
    if (userSnap.empty) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    const ok = await bcrypt.compare(password, userData.password);
    if (!ok) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

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

    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error('Erro no login:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
