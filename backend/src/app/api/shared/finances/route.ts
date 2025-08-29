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
  try {
    await initFirestore();

    // ✅ Middleware já validou; aqui só extraímos o payload
    const authToken = req.cookies.get('auth_token')?.value!;
    const user = verifyToken(authToken);

    const { year, month } = await req.json();

    // Shared accounts
    const sharedSnap = await firestore
      .collection('shared_accounts')
      .where('sharedWithUserId', '==', user.id)
      .get();

    const ids = sharedSnap.docs.map((doc) => doc.data().userId);
    const allUserIds = Array.from(new Set([...ids, user.id]));

    // Colaboradores
    const collabsSnap = await firestore
      .collection('collaborators')
      .where('userId', 'in', allUserIds)
      .get();

    const collabs = collabsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const collabIds = collabs.map((c) => c.id);

    // Contas relacionadas
    let accounts: Account[] = [];
    if (collabIds.length > 0) {
      const accountsSnap = await firestore
        .collection('accounts')
        .where('collaboratorId', 'in', collabIds)
        .get();

      accounts = accountsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Account
      );
    }

    return NextResponse.json({ accounts, collabs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
