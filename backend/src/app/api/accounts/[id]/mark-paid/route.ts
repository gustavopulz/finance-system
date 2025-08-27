import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    verifyToken(authToken);
    const { id } = await context.params;

    let payload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Body da requisição ausente ou inválido.' },
        { status: 400 }
      );
    }

    if (!payload || typeof payload.paid !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo "paid" deve ser booleano.' },
        { status: 400 }
      );
    }

    // Obtém os dados da conta para verificar se é recorrente
    const accountDoc = await firestore.collection('accounts').doc(id).get();
    if (!accountDoc.exists) {
      return NextResponse.json(
        { error: 'Conta não encontrada.' },
        { status: 404 }
      );
    }

    // Para contas não-recorrentes (avulsas ou parceladas), usa o campo paid tradicional
    const dtPaid = payload.paid ? new Date().toISOString() : null;
    await firestore
      .collection('accounts')
      .doc(id)
      .update({ paid: payload.paid, dtPaid });
    return NextResponse.json({ id, paid: payload.paid, dtPaid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
