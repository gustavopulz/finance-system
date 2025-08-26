import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    verifyToken(authToken);
    const { id } = await context.params;
    const payload = await req.json();
    if (typeof payload.paid !== 'boolean') {
      return NextResponse.json({ error: 'Campo "paid" deve ser booleano.' }, { status: 400 });
    }
    await firestore.collection('accounts').doc(id).update({ paid: payload.paid });
    return NextResponse.json({ id, paid: payload.paid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
