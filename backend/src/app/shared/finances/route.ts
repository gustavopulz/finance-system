import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../lib/firestore';
import { verifyToken } from '../../../lib/jwt';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const sharedSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', user.id).get();
    const ids = sharedSnap.docs.map(doc => doc.data().userId);
    const allUserIds = Array.from(new Set([...ids, user.id]));
    const accountsSnap = await firestore.collection('accounts').where('userId', 'in', allUserIds).get();
    const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const collabsSnap = await firestore.collection('collaborators').where('userId', 'in', allUserIds).get();
    const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ accounts, collabs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
