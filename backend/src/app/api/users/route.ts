import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await initFirestore();
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(token, 'admin');
    const usersSnap = await firestore.collection('users').get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  await initFirestore();
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    verifyToken(token, 'admin');
    const { username, password, role } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha obrigatórios' }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    const existingSnap = await firestore.collection('users').where('username', '==', username.trim()).get();
    if (!existingSnap.empty) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 400 });
    }
    const userRef = await firestore.collection('users').add({
      username: username.trim(),
      password: hash,
      role: role || 'user',
    });
    return NextResponse.json({ id: userRef.id, username, role: role || 'user' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
