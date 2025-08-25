import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await initFirestore();
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    verifyToken(token);
    // Await params as required by Next.js 15+
    const awaitedParams = await params;
    const { id } = awaitedParams;
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
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      cancelledAt = `${yyyy}-${mm}-${dd}`;
      await firestore.collection('accounts').doc(id).update({ status: newStatus, cancelledAt });
    }
    return NextResponse.json({ id, status: newStatus, cancelledAt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
