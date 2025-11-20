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

    // direction can be 'see-me' (default) or 'i-see'
    const direction = req.nextUrl.searchParams.get('direction') || 'see-me';
    let linkSnap;
    if (direction === 'i-see') {
      // Other user shared with me
      linkSnap = await firestore
        .collection('shared_accounts')
        .where('userId', '==', otherUserId)
        .where('sharedWithUserId', '==', user.id)
        .get();
    } else {
      // I shared with other user
      linkSnap = await firestore
        .collection('shared_accounts')
        .where('userId', '==', user.id)
        .where('sharedWithUserId', '==', otherUserId)
        .get();
    }
    if (linkSnap.empty)
      return NextResponse.json(
        { error: 'Vínculo não encontrado' },
        { status: 404 }
      );
    const linkDoc = linkSnap.docs[0];
    const data: any = linkDoc.data();
    let allowed: string[] = Array.isArray(data.allowedCollabIds)
      ? data.allowedCollabIds
      : [];
    // If the link document has the field and it's an empty array, it explicitly means "no restriction"; don't fallback.
    const hasExplicitField = Object.prototype.hasOwnProperty.call(
      data,
      'allowedCollabIds'
    );
    if (!hasExplicitField && !allowed.length) {
      // Fallback to token-level configuration from the owner of the data being shared
      const ownerId = direction === 'i-see' ? otherUserId : user.id;
      const tokenCfg = await firestore
        .collection('shared_accounts_tokens')
        .doc(String(ownerId))
        .get();
      const tokenData = tokenCfg.exists ? (tokenCfg.data() as any) : null;
      if (Array.isArray(tokenData?.allowedCollabIds)) {
        allowed = tokenData!.allowedCollabIds.map(String);
      }
    }
    return NextResponse.json({ allowedCollabIds: allowed });
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

    const direction = req.nextUrl.searchParams.get('direction') || 'see-me';
    let linkSnap;
    if (direction === 'i-see') {
      linkSnap = await firestore
        .collection('shared_accounts')
        .where('userId', '==', otherUserId)
        .where('sharedWithUserId', '==', user.id)
        .get();
    } else {
      linkSnap = await firestore
        .collection('shared_accounts')
        .where('userId', '==', user.id)
        .where('sharedWithUserId', '==', otherUserId)
        .get();
    }
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
