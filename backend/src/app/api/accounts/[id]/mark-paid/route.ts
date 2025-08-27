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
    const payload = await req.json();

    if (typeof payload.paid !== 'boolean') {
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

    const accountData = accountDoc.data();
    const isRecurrentAccount =
      accountData?.parcelasTotal === null ||
      accountData?.parcelasTotal === undefined;

    // Se for conta recorrente (fixa) e temos month/year no payload, usa paidByMonth
    if (isRecurrentAccount && payload.month && payload.year) {
      const monthKey = `${payload.year}-${String(payload.month).padStart(2, '0')}`;
      const currentPaidByMonth = accountData?.paidByMonth || {};

      const updatedPaidByMonth = { ...currentPaidByMonth };
      if (payload.paid) {
        updatedPaidByMonth[monthKey] = true;
      } else {
        delete updatedPaidByMonth[monthKey];
      }

      await firestore.collection('accounts').doc(id).update({
        paidByMonth: updatedPaidByMonth,
        // Mantém o campo paid para compatibilidade, mas prioriza paidByMonth
        paid: false,
      });

      return NextResponse.json({
        id,
        paid: payload.paid,
        paidByMonth: updatedPaidByMonth,
        month: payload.month,
        year: payload.year,
      });
    } else {
      // Para contas não-recorrentes (avulsas ou parceladas), usa o campo paid tradicional
      await firestore
        .collection('accounts')
        .doc(id)
        .update({ paid: payload.paid });
      return NextResponse.json({ id, paid: payload.paid });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
