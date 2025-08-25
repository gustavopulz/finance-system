import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    verifyToken(authToken);
    // Await params as required by Next.js 15+
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const payload = await req.json();
    const updateData: Record<string, any> = {};
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        if (key === 'description' && typeof payload[key] === 'string') {
          updateData[key] = payload[key].trim();
        } else if ((key === 'origem' || key === 'responsavel') && payload[key] === '') {
          updateData[key] = null;
        } else {
          updateData[key] = payload[key];
        }
      }
    }
    await firestore.collection('accounts').doc(id).update(updateData);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    verifyToken(authToken);
    // Await params as required by Next.js 15+
    const awaitedParams = await params;
    const { id } = awaitedParams;
    await firestore.collection('accounts').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
