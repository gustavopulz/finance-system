import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest, context: { params: Promise<{ otherUserId: string }> }) {
  await initFirestore();
  try {
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);
    // IDs do Firebase são strings
    const { otherUserId } = await context.params;
    const linksSnap = await firestore.collection('shared_accounts')
      .where('userId', '==', user.id)
      .where('sharedWithUserId', '==', otherUserId)
      .get();
    if (linksSnap.empty) {
      return NextResponse.json({ success: false, error: 'Vínculo não encontrado.' }, { status: 404 });
    }
    await linksSnap.docs[0].ref.delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
