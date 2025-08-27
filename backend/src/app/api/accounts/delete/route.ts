import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest) {
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

    if (!payload || !Array.isArray(payload.accounts)) {
      return NextResponse.json(
        { error: 'Campo "accounts" (array) é obrigatório.' },
        { status: 400 }
      );
    }

    const batch = firestore.batch();
    const results = [];
    for (const id of payload.accounts) {
      const accountRef = firestore.collection('accounts').doc(id);
      batch.delete(accountRef);
      results.push({ id, deleted: true });
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
