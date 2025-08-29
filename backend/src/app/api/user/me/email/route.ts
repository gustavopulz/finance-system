import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(req: NextRequest) {
  await initFirestore();

  const authToken = req.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  }

  const user = verifyToken(authToken);

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    await firestore.collection('users').doc(user.id).update({ email });

    const userDoc = await firestore.collection('users').doc(user.id).get();
    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      id: userDoc.id,
      name: userData?.name,
      role: userData?.role,
      email: userData?.email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
