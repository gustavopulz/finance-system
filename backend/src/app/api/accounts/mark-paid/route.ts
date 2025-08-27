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
    const results = [];
    for (const id of payload.accounts) {
      try {
        const accountDoc = await firestore.collection('accounts').doc(id).get();
        if (!accountDoc.exists) {
          results.push({ id, error: 'Conta não encontrada.' });
          continue;
        }
        await firestore.collection('accounts').doc(id).update({ paid: payload.paid, dtPaid });
        results.push({ id, paid: payload.paid, dtPaid });
      } catch (err: any) {
        results.push({ id, error: err.message });
      }
    }
    return NextResponse.json({ results });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
