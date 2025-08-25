import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest) {
  await initFirestore();
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const { password } = await req.json();
    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'Senha deve ter ao menos 4 caracteres' }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    await firestore.collection('users').doc(String(user.id)).update({ password: hash });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
