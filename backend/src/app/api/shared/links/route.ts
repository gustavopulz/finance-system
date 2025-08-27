import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    const user = verifyToken(authToken);
    const iSeeSnap = await firestore.collection('shared_accounts').where('userId', '==', user.id).get();
    const iSee = iSeeSnap.docs.map(doc => ({ id: doc.data().sharedWithUserId, name: doc.data().sharedWithUserName }));
    const seeMeSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', user.id).get();
    const seeMe = seeMeSnap.docs.map(doc => ({ id: doc.data().userId, name: doc.data().sharedWithUserName }));
    return NextResponse.json({ iSee, seeMe });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
