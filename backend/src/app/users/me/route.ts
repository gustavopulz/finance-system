import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../lib/firestore';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../lib/jwt';

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
  try {
    const user = verifyToken(authHeader.split(' ')[1]);
    const { username } = await req.json();
    if (!username || username.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    await firestore.collection('users').doc(String(user.id)).update({ username: username.trim() });
    return NextResponse.json({ success: true, username: username.trim() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
