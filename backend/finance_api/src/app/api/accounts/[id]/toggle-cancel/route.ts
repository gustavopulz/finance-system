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
    // Await params as required by Next.js 15+
    const { id } = await context.params;
    const payload = await req.json();
    // Tenta atualizar para Cancelado, se já estiver Cancelado volta para Pendente
    // Usa transaction para garantir consistência
    let newStatus, cancelledAt;
    await firestore.runTransaction(async (t) => {
      const ref = firestore.collection('accounts').doc(id);
      const doc = await t.get(ref);
      if (!doc.exists) {
        throw new Error('Conta não encontrada');
      }
      const currentStatus = doc.data()?.status;
      if (currentStatus === 'Cancelado') {
        newStatus = 'Pendente';
        cancelledAt = null;
        t.update(ref, { status: newStatus, cancelledAt: null });
      } else {
        newStatus = 'Cancelado';
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        cancelledAt = `${yyyy}-${mm}-${dd}`;
        t.update(ref, { status: newStatus, cancelledAt });
      }
    });
    return NextResponse.json({ id, status: newStatus, cancelledAt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
