import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest, { params }: { params: { otherUserId: string } }) {
  await initFirestore();
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(token);
    // Await params as required by Next.js 15+
    const awaitedParams = await params;
    const otherUserId = Number(awaitedParams.otherUserId);
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
