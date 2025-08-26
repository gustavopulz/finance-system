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
    // Salva no documento de ordem
    await firestore.collection('collabOrders').doc(userId).set({ order });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Recupera a ordem dos colaboradores
export async function GET(req: NextRequest) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    const user = verifyToken(authToken);
    const userId = req.nextUrl.searchParams.get('userId') || user.id;
    const doc = await firestore.collection('collabOrders').doc(userId).get();
    let order: string[] = [];
    if (doc.exists) {
      const data = doc.data();
      if (data && Array.isArray(data.order)) {
        order = data.order;
      }
    }
    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
