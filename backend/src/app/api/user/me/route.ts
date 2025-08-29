import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await initFirestore();

    // ✅ Middleware já garantiu autenticado; só decodifica
    const authToken = req.cookies.get('auth_token')?.value!;
    const user = verifyToken(authToken);

    const userDoc = await firestore.collection('users').doc(user.id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    return NextResponse.json({
      id: userDoc.id,
      name: userData?.name,
      role: userData?.role,
      email: userData?.email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await initFirestore();

    const authToken = req.cookies.get('auth_token')?.value!;
    const user = verifyToken(authToken);

    const { name } = await req.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Atualiza no Firestore
    await firestore.collection('users').doc(user.id).update({ name: name.trim() });

    // Busca novamente o doc atualizado
    const userDoc = await firestore.collection('users').doc(user.id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      id: userDoc.id,
      name: userData?.name,
      role: userData?.role,
      email: userData?.email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
