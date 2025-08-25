import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  await initFirestore();
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const { token } = await req.json();
    const tokenSnap = await firestore.collection('shared_accounts_tokens').where('token', '==', token).get();
    if (tokenSnap.empty) return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    const userId = tokenSnap.docs[0].data().userId;
    if (userId === user.id) {
      return NextResponse.json({ error: 'Não pode mesclar consigo mesmo' }, { status: 400 });
    }
    const linkSnap = await firestore.collection('shared_accounts')
      .where('userId', '==', userId)
      .where('sharedWithUserId', '==', user.id)
      .get();
    if (!linkSnap.empty) return NextResponse.json({ error: 'Já vinculado' }, { status: 400 });
    await firestore.collection('shared_accounts').add({ userId, sharedWithUserId: user.id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
