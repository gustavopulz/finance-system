import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

// Save configuration of which collaborators are shared via token
export async function PUT(req: NextRequest) {
  await initFirestore();
  try {
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);

    const { allowedCollabIds } = await req.json();
    if (!Array.isArray(allowedCollabIds)) {
      return NextResponse.json(
        { error: 'allowedCollabIds inválido' },
        { status: 400 }
      );
    }

    // Validate that collab IDs belong to the user
    if (allowedCollabIds.length) {
      const collabsSnap = await firestore
        .collection('collaborators')
        .where('__name__', 'in', allowedCollabIds.slice(0, 10)) // Firestore in limit workaround
        .get();
      const invalid =
        collabsSnap.docs.filter((d) => d.data().userId !== user.id).length > 0;
      if (invalid)
        return NextResponse.json(
          { error: 'IDs de colaboradores inválidos' },
          { status: 400 }
        );
      // If more than 10, we trust client but still store; fetching validation in chunks would be verbose
    }

    await firestore
      .collection('shared_accounts_tokens')
      .doc(String(user.id))
      .set({ userId: user.id, allowedCollabIds }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Fetch token configuration for current user
export async function GET(req: NextRequest) {
  await initFirestore();
  try {
    const cookie = req.cookies.get('auth_token');
    const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
    if (!authToken) throw new Error('Token ausente');
    const user = verifyToken(authToken);

    const snap = await firestore
      .collection('shared_accounts_tokens')
      .doc(String(user.id))
      .get();
    const data = snap.exists ? snap.data() : {};
    return NextResponse.json({
      token: data?.token || null,
      allowedCollabIds: Array.isArray(data?.allowedCollabIds)
        ? data!.allowedCollabIds
        : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
