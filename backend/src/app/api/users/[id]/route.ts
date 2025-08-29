import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';
import { validarRole } from '@/lib/validarRole';

// Alterar user role
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await initFirestore();
  const authToken = req.cookies.get('auth_token')?.value!;
  const user = verifyToken(authToken, 'admin');

  try {
    await validarRole(user.id, "admin");
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'ID do usuário ausente.' }, { status: 400 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (!payload.role || (payload.role !== 'admin' && payload.role !== 'user')) {
    return NextResponse.json({ error: 'Role inválido.' }, { status: 400 });
  }

  try {
    await firestore.collection('users').doc(id).update({ role: payload.role });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await initFirestore();
  const cookie = req.cookies.get('auth_token');
  const authToken = typeof cookie === 'string' ? cookie : cookie?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  }
  let user;
  try {
    user = verifyToken(authToken, "admin");
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }

  const hasRole = await validarRole(user.id, "admin");
  if (!hasRole) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'ID do usuário ausente.' }, { status: 400 });
  }

  try {
    // Remove usuário
    await firestore.collection('users').doc(id).delete();

    // Remove colaboradores associados ao usuário
    const collabsSnap = await firestore.collection('collaborators').where('userId', '==', id).get();
    const collabDeletes = collabsSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(collabDeletes);

    // Remove contas dos colaboradores (only if there are collaborators)
    let accountDeletes: Promise<any>[] = [];
    if (collabsSnap.docs.length > 0) {
      const accountsSnap = await firestore.collection('accounts').where('collaboratorId', 'in', collabsSnap.docs.map(doc => doc.id)).get();
      accountDeletes = accountsSnap.docs.map(doc => doc.ref.delete());
      await Promise.all(accountDeletes);
    }

    // Remove shared_accounts_tokens do usuário
    const tokensSnap = await firestore.collection('shared_accounts_tokens').where('userId', '==', id).get();
    const tokenDeletes = tokensSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(tokenDeletes);

    // Remove shared_accounts do usuário
    const sharedSnap = await firestore.collection('shared_accounts').where('userId', '==', id).get();
    const sharedDeletes = sharedSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(sharedDeletes);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}