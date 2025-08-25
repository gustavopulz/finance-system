import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../lib/firestore';
import { verifyToken } from '../../../lib/jwt';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const userDoc = await firestore.collection('users').doc(String(user.id)).get();
    const username = userDoc.exists ? userDoc.data()?.username : '';
    const raw = `${username}:${user.id}:${Date.now()}:${Math.random()}`;
    const token = crypto.createHash('sha256').update(raw).digest('hex');
    await firestore.collection('shared_accounts_tokens').doc(String(user.id)).set({ userId: user.id, token });
    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
