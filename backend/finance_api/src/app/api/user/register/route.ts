import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await initFirestore();
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, email, password' }, { status: 400 });
  }

  // Verifica se já existe usuário com mesmo email
  const userSnap = await firestore.collection('users').where('email', '==', email).get();
  if (!userSnap.empty) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
  }

  // Cria usuário
  const hash = await bcrypt.hash(password, 10);
  const userRef = await firestore.collection('users').add({
    name,
    email,
    password: hash,
    role: role || 'user',
  });

  return NextResponse.json({ success: true, id: userRef.id });
}
