const bcrypt = require('bcryptjs');
const { firestore } = require('../../backend/src/db');

exports.handler = async function(event) {
  const method = event.httpMethod;
  const path = event.path;
  const headers = event.headers;
  const body = event.body ? JSON.parse(event.body) : {};

  // Helper: get user from JWT
  const getUserFromToken = () => {
    const header = headers['authorization'] || headers['Authorization'];
    if (!header) return null;
    const token = header.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../../backend/src/jwt');
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  };
  const user = getUserFromToken();

  // PATCH /api/users/me
  if (method === 'PATCH' && path.endsWith('/me')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const { username } = body;
    if (!username || username.trim() === '') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Nome é obrigatório' }) };
    }
    await firestore.collection('users').doc(String(user.id)).update({ username: username.trim() });
    return { statusCode: 200, body: JSON.stringify({ success: true, username: username.trim() }) };
  }

  // PATCH /api/users/me/password
  if (method === 'PATCH' && path.endsWith('/me/password')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const { password } = body;
    if (!password || password.length < 4) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Senha deve ter ao menos 4 caracteres' }) };
    }
    const hash = await bcrypt.hash(password, 10);
    await firestore.collection('users').doc(String(user.id)).update({ password: hash });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  // GET /api/users (admin)
  if (method === 'GET' && path.endsWith('/users')) {
    if (!user || user.role !== 'admin') return { statusCode: 403, body: JSON.stringify({ error: 'Acesso negado' }) };
    const usersSnap = await firestore.collection('users').get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { statusCode: 200, body: JSON.stringify(users) };
  }

  // POST /api/users (admin)
  if (method === 'POST' && path.endsWith('/users')) {
    if (!user || user.role !== 'admin') return { statusCode: 403, body: JSON.stringify({ error: 'Acesso negado' }) };
    const { username, password, role } = body;
    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Usuário e senha obrigatórios' }) };
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      const existingSnap = await firestore.collection('users').where('username', '==', username.trim()).get();
      if (!existingSnap.empty) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Usuário já existe' }) };
      }
      const userRef = await firestore.collection('users').add({
        username: username.trim(),
        password: hash,
        role: role || 'user',
      });
      return { statusCode: 200, body: JSON.stringify({ id: userRef.id, username, role: role || 'user' }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao criar usuário' }) };
    }
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};
