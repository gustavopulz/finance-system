import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

// GET and PUT configuration for a specific link (who can see my account)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ otherUserId: string }> }
) {
  await initFirestore();
  try {
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);
    const { otherUserId } = await context.params;

    // Only owner of the link (userId=user.id) can configure what others see of their account
    const linkSnap = await firestore
      .collection('shared_accounts')
      .where('userId', '==', user.id)
      .where('sharedWithUserId', '==', otherUserId)
      .get();
    if (linkSnap.empty)
      return NextResponse.json(
        { error: 'Vínculo não encontrado' },
        { status: 404 }
      );
    const linkDoc = linkSnap.docs[0];
    const data = linkDoc.data();
    return NextResponse.json({ allowedCollabIds: data.allowedCollabIds || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ otherUserId: string }> }
) {
  await initFirestore();
  try {
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);
    const { otherUserId } = await context.params;
    const { allowedCollabIds } = await req.json();
    if (!Array.isArray(allowedCollabIds)) {
      return NextResponse.json(
        { error: 'allowedCollabIds inválido' },
        { status: 400 }
      );
    }

    const linkSnap = await firestore
      .collection('shared_accounts')
      .where('userId', '==', user.id)
      .where('sharedWithUserId', '==', otherUserId)
      .get();
    if (linkSnap.empty)
      return NextResponse.json(
        { error: 'Vínculo não encontrado' },
        { status: 404 }
      );
    const linkDoc = linkSnap.docs[0];

    await linkDoc.ref.set({ allowedCollabIds }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
