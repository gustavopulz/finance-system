import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { JWT_SECRET } from '@/lib/jwt';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await initFirestore();
  const { username, password, email } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Usuário e senha obrigatórios' }, { status: 400 });
  }

  const userSnap = await firestore.collection('users').where('username', '==', username).get();
  if (userSnap.empty) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const userDoc = userSnap.docs[0];
  const userData = userDoc.data();
  const user = { id: userDoc.id, username: userData.username, password: userData.password, role: userData.role };
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  // Se o email foi enviado e não está salvo, atualiza o documento do usuário
  if (email && (!userData.email || userData.email !== email)) {
    await firestore.collection('users').doc(user.id).update({ email });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const response = NextResponse.json({
    user: { id: user.id, username: user.username, role: user.role, email: email || userData.email },
  });
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
  return response;
}
