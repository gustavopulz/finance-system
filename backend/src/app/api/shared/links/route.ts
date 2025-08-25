import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await initFirestore();
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const iSeeSnap = await firestore.collection('shared_accounts').where('userId', '==', user.id).get();
    const iSee = iSeeSnap.docs.map(doc => ({ id: doc.data().sharedWithUserId }));
    const seeMeSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', user.id).get();
    const seeMe = seeMeSnap.docs.map(doc => ({ id: doc.data().userId }));
    return NextResponse.json({ iSee, seeMe });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
