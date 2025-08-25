import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../lib/firestore';
import { JWT_SECRET } from '../../lib/jwt';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
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

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
}
