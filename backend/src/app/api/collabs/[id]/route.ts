import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) throw new Error('Token ausente');
  try {
    verifyToken(authToken);
    const { id } = await context.params;
    // Apagar todas as contas associadas ao colaborador
    const accountsSnapshot = await firestore.collection('accounts').where('collaboratorId', '==', id).get();
    const batch = firestore.batch();
    accountsSnapshot.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    // Apagar o colaborador
    await firestore.collection('collaborators').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
