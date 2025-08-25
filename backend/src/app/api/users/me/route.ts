export async function GET(req: NextRequest) {
  const authToken = req.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  }
  try {
    const user = verifyToken(authToken);
    return NextResponse.json({ id: user.id, username: user.username, role: user.role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authToken);
    const { username } = await req.json();
    if (!username || username.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    await firestore.collection('users').doc(String(user.id)).update({ username: username.trim() });
    return NextResponse.json({ success: true, username: username.trim() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
