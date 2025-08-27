import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

interface Account {
  id: string;
  parcelasTotal?: number | null;
  year?: number;
  month?: number;
}

export async function POST(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    const body = await req.json();
    const { year, month } = body;
    const user = verifyToken(authToken);
    const sharedSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', user.id).get();
    const ids = sharedSnap.docs.map(doc => doc.data().userId);
    const allUserIds = Array.from(new Set([...ids, user.id]));
    // Executa as queries em paralelo
    const [accountsSnap, collabsSnap] = await Promise.all([
      firestore.collection('accounts').where('userId', 'in', allUserIds).get(),
      firestore.collection('collaborators').where('userId', 'in', allUserIds).get()
    ]);
    // Filtra contas por year e month OU parcela == null
    const accounts = accountsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Account)
      .filter(acc => {
        if (acc.parcelasTotal == null) return true;
        // Supondo que acc.year e acc.month existam
        return acc.year === year && acc.month === month;
      });
    const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ accounts, collabs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
