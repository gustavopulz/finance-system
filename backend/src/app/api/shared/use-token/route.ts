import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  await initFirestore();
  try {
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);

    const { token } = await req.json();
    const tokenSnap = await firestore
      .collection('shared_accounts_tokens')
      .where('token', '==', token)
      .get();
    if (tokenSnap.empty)
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });

    const userId = tokenSnap.docs[0].data().userId;
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Não pode mesclar consigo mesmo' },
        { status: 400 }
      );
    }

    const linkSnap = await firestore
      .collection('shared_accounts')
      .where('userId', '==', userId)
      .where('sharedWithUserId', '==', user.id)
      .get();
    if (!linkSnap.empty)
      return NextResponse.json({ error: 'Já vinculado' }, { status: 400 });

    // Get token owner username
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists)
      return NextResponse.json(
        { error: 'Usuário do token não encontrado' },
        { status: 400 }
      );
    const sharedByUserName = userDoc.data()?.name;

    // Read token owner's default collaborator restrictions (token-config)
    let allowedCollabIds: string[] = [];
    try {
      const tokenOwnerCfg = await firestore
        .collection('shared_accounts_tokens')
        .doc(String(userId))
        .get();
      const data = tokenOwnerCfg.exists ? (tokenOwnerCfg.data() as any) : null;
      if (Array.isArray(data?.allowedCollabIds)) {
        allowedCollabIds = data!.allowedCollabIds.map(String);
      }
    } catch {}

    // Create the link, inheriting token-level config if present
    const linkPayload: any = {
      userId,
      sharedByUser: sharedByUserName,
      sharedWithUserId: user.id,
      sharedWithUserName: user.name,
    };
    if (allowedCollabIds.length)
      linkPayload.allowedCollabIds = allowedCollabIds;

    await firestore.collection('shared_accounts').add(linkPayload);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
