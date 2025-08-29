import { NextRequest, NextResponse } from 'next/server';
import { initFirestore, firestore } from '@/lib/firestore';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';
import { validarRole } from '@/lib/validarRole';

export async function GET(req: NextRequest) {
  await initFirestore();

  const authToken = req.cookies.get('auth_token')?.value!;
  const user = verifyToken(authToken, 'admin');

  try {
    await validarRole(user.id, "admin");
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }

  try {
    const usersSnap = await firestore.collection('users').get();
    const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
