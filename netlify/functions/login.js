const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { firestore } = require('../../backend/src/db');
const { JWT_SECRET } = require('../../backend/src/jwt');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { username, password } = JSON.parse(event.body || '{}');
  if (!username || !password)
    return { statusCode: 400, body: JSON.stringify({ error: 'Usuário e senha obrigatórios' }) };

  const userSnap = await firestore.collection('users').where('username', '==', username).get();
  if (userSnap.empty)
    return { statusCode: 401, body: JSON.stringify({ error: 'Credenciais inválidas' }) };

  const userDoc = userSnap.docs[0];
  const userData = userDoc.data();
  const user = { id: userDoc.id, username: userData.username, password: userData.password, role: userData.role };
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { statusCode: 401, body: JSON.stringify({ error: 'Credenciais inválidas' }) };

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    })
  };
};
