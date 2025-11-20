import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getUserFromFirestore } from '@/lib/users';

export async function GET(req: NextRequest) {
  try {
    const authToken = req.cookies.get('auth_token')?.value!;
    const user = verifyToken(authToken);

    const userData = await getUserFromFirestore(user.id);
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
    });
  } catch (err: any) {
    if (err.message === 'Token expirado') {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 });
    }
    if (err.message === 'Token inválido') {
      return NextResponse.json({ error: 'invalid_token' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authToken = req.cookies.get('auth_token')?.value!;
    const user = verifyToken(authToken);

    const { name } = await req.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Atualiza no Firestore
    const userRef = (await import('@/lib/firestore')).firestore.collection('users').doc(user.id);
    await userRef.update({ name: name.trim() });

    const userData = await (await userRef.get()).data();
    return NextResponse.json({
      success: true,
      id: user.id,
      name: userData?.name,
      role: userData?.role,
      email: userData?.email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
