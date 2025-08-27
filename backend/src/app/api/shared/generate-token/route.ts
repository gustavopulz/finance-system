import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    const user = verifyToken(authToken);
    const userDoc = await firestore
      .collection('users')
      .doc(String(user.id))
      .get();
    const name = userDoc.exists ? userDoc.data()?.name : '';
    const raw = `${name}:${user.id}:${Date.now()}:${Math.random()}`;
    const token = crypto.createHash('sha256').update(raw).digest('hex');
    await firestore
      .collection('shared_accounts_tokens')
      .doc(String(user.id))
      .set({ userId: user.id, token });
    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
