import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest, { params }: { params: { otherUserId: string } }) {
  await initFirestore();
  try {
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);
    // IDs do Firebase são strings
    const otherUserId = params.otherUserId;
    const linksSnap = await firestore.collection('shared_accounts')
      .where('userId', 'in', [user.id, otherUserId])
      .where('sharedWithUserId', 'in', [user.id, otherUserId])
      .get();
    const batch = firestore.batch();
    linksSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
