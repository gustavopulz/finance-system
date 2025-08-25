import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../../lib/firestore';
import { verifyToken } from '../../../../lib/jwt';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    verifyToken(authHeader.split(' ')[1]);
    const { id } = params;
    const payload = await req.json();
    const accountDoc = await firestore.collection('accounts').doc(id).get();
    if (!accountDoc.exists) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }
    const currentStatus = accountDoc.data()?.status;
    let newStatus, cancelledAt;
    if (currentStatus === 'cancelado') {
      newStatus = 'ativo';
      cancelledAt = null;
      await firestore.collection('accounts').doc(id).update({ status: newStatus, cancelledAt: null });
    } else {
      newStatus = 'cancelado';
      const { month, year } = payload;
      let cancelledYear, cancelledMonth;
      if (month && year) {
        cancelledYear = Number(year);
        cancelledMonth = Number(month);
      } else {
        const now = new Date();
        cancelledYear = now.getFullYear();
        cancelledMonth = now.getMonth() + 1;
      }
      cancelledAt = new Date(
        cancelledYear,
        cancelledMonth - 1,
        1
      ).toISOString();
      await firestore.collection('accounts').doc(id).update({ status: newStatus, cancelledAt });
    }
    return NextResponse.json({ id, status: newStatus, cancelledAt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
