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
    const sharedSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', user.id).get();
    const ids = sharedSnap.docs.map(doc => doc.data().userId);
    const allUserIds = Array.from(new Set([...ids, user.id]));
    // Executa as queries em paralelo
    const [accountsSnap, collabsSnap] = await Promise.all([
      firestore.collection('accounts').where('userId', 'in', allUserIds).get(),
      firestore.collection('collaborators').where('userId', 'in', allUserIds).get()
    ]);
    const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ accounts, collabs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
