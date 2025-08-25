import { firestore } from '../../src/db.js';
import bcrypt from 'bcryptjs';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  if (req.method === 'PATCH' && req.url === '/me') {
    const userId = req.user.id;
    const { username } = req.body;
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    await firestore.collection('users').doc(String(userId)).update({ username: username.trim() });
    return res.json({ success: true, username: username.trim() });
  }
  if (req.method === 'PATCH' && req.url === '/me/password') {
    const userId = req.user.id;
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Senha deve ter ao menos 4 caracteres' });
    }
    const hash = await bcrypt.hash(password, 10);
    await firestore.collection('users').doc(String(userId)).update({ password: hash });
    return res.json({ success: true });
  }
  if (req.method === 'GET') {
    // admin only
    await auth('admin')(req, res, async () => {
      const usersSnap = await firestore.collection('users').get();
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(users);
    });
  }
  if (req.method === 'POST') {
    // admin only
    await auth('admin')(req, res, async () => {
      const { username, password, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
      }
      const hash = await bcrypt.hash(password, 10);
      try {
        const existingSnap = await firestore.collection('users').where('username', '==', username.trim()).get();
        if (!existingSnap.empty) {
          return res.status(400).json({ error: 'Usuário já existe' });
        }
        const userRef = await firestore.collection('users').add({
          username: username.trim(),
          password: hash,
          role: role || 'user',
        });
        return res.json({ id: userRef.id, username, role: role || 'user' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }
    });
  }
  res.status(404).json({ error: 'Not found' });
}
