import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(
  req: NextRequest
) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    verifyToken(authToken);

    let payload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Body da requisição ausente ou inválido.' },
        { status: 400 }
      );
    }

    if (!payload || !Array.isArray(payload.accounts) || typeof payload.paid !== 'boolean') {
      return NextResponse.json(
        { error: 'Campos "accounts" (array) e "paid" (boolean) são obrigatórios.' },
        { status: 400 }
      );
    }

    const dtPaid = payload.paid ? new Date() : null;
    const batch = firestore.batch();
    const results = [];
    for (const id of payload.accounts) {
      const accountRef = firestore.collection('accounts').doc(id);
      batch.update(accountRef, { paid: payload.paid, dtPaid });
      results.push({ id, paid: payload.paid, dtPaid });
    }
    try {
      await batch.commit();
      return NextResponse.json({ results });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
