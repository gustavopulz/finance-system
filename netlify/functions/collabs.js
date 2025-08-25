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

  // GET /api/collabs
  if (method === 'GET' && path.endsWith('/collabs')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const userId = event.queryStringParameters?.userId || user.id;
    const collabsSnap = await firestore.collection('collaborators').where('userId', '==', userId).get();
    const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { statusCode: 200, body: JSON.stringify(collabs) };
  }

  // POST /api/collabs
  if (method === 'POST' && path.endsWith('/collabs')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const { nome, userId } = body;
    const uid = userId || user.id;
    if (!nome || nome.trim() === '') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Nome é obrigatório' }) };
    }
    try {
      const existingSnap = await firestore.collection('collaborators').where('userId', '==', uid).where('name', '==', nome.trim()).get();
      if (!existingSnap.empty) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Já existe um colaborador com esse nome' }) };
      }
      const collabRef = await firestore.collection('collaborators').add({ name: nome.trim(), userId: uid });
      return { statusCode: 200, body: JSON.stringify({ id: collabRef.id, name: nome.trim(), userId: uid }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao adicionar colaborador' }) };
    }
  }

  // DELETE /api/collabs/:id
  if (method === 'DELETE' && /\/collabs\/.+/.test(path)) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const idMatch = path.match(/\/collabs\/(.+)$/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'ID do colaborador não informado' }) };
    await firestore.collection('collaborators').doc(id).delete();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};
