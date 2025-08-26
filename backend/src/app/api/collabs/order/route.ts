import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

// Salva a ordem dos colaboradores
export async function POST(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    const user = verifyToken(authToken);
    const userId = req.nextUrl.searchParams.get('userId') || user.id;
    const { order } = await req.json(); // array de IDs
    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Ordem inválida' }, { status: 400 });
    }
    // Atualiza o campo orderId de cada colaborador
    const batch = firestore.batch();
    order.forEach((collabId: string, idx: number) => {
      const collabRef = firestore.collection('collaborators').doc(collabId);
      batch.update(collabRef, { orderId: idx + 1 });
    });
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}