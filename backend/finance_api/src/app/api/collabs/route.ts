import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await initFirestore();
  
  const authToken = req.cookies.get('auth_token')?.value!;
  const user = verifyToken(authToken);

  try {
    const userId = req.nextUrl.searchParams.get('userId') || user.id;
    const collabsSnap = await firestore.collection('collaborators').where('userId', '==', userId).get();
    const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(collabs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  await initFirestore();

  const authToken = req.cookies.get('auth_token')?.value!;
  const user = verifyToken(authToken);

  try {
    const { nome } = await req.json();
    if (!nome || nome.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    const existingSnap = await firestore.collection('collaborators').where('userId', '==', user.id).where('name', '==', nome.trim()).get();
    if (!existingSnap.empty) {
      return NextResponse.json({ error: 'Já existe um colaborador com esse nome' }, { status: 400 });
    }
    // Busca quantidade de colaboradores para definir orderId
    const allCollabsSnap = await firestore.collection('collaborators').where('userId', '==', user.id).get();
    const orderId = allCollabsSnap.size + 1;
    const collabRef = await firestore.collection('collaborators').add({ name: nome.trim(), userId: user.id, orderId });
    return NextResponse.json({ id: collabRef.id, name: nome.trim(), userId: user.id, orderId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
