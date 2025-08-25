import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../lib/firestore';
import { verifyToken } from '../../lib/jwt';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const userId = req.nextUrl.searchParams.get('userId') || user.id;
    const collabsSnap = await firestore.collection('collaborators').where('userId', '==', userId).get();
    const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(collabs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const { nome, userId } = await req.json();
    const uid = userId || user.id;
    if (!nome || nome.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    const existingSnap = await firestore.collection('collaborators').where('userId', '==', uid).where('name', '==', nome.trim()).get();
    if (!existingSnap.empty) {
      return NextResponse.json({ error: 'Já existe um colaborador com esse nome' }, { status: 400 });
    }
    const collabRef = await firestore.collection('collaborators').add({ name: nome.trim(), userId: uid });
    return NextResponse.json({ id: collabRef.id, name: nome.trim(), userId: uid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
