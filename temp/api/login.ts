import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestore } from '../../lib/server/db';
import { JWT_SECRET } from '../../lib/server/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

  const firestore = getFirestore();
  const userSnap = await firestore.collection('users').where('username', '==', username).get();
  if (userSnap.empty)
    return res.status(401).json({ error: 'Credenciais inválidas' });

  const userDoc = userSnap.docs[0];
  const userData = userDoc.data();
  const user = { id: userDoc.id, username: userData.username, password: userData.password, role: userData.role };
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
}