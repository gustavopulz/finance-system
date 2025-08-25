const { firestore } = require('../../backend/src/db');
const crypto = require('crypto');

exports.handler = async function(event) {
  const method = event.httpMethod;
  const path = event.path;
  const headers = event.headers;
  const body = event.body ? JSON.parse(event.body) : {};
  const query = event.queryStringParameters || {};

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

  // POST /api/shared/generate-token
  if (method === 'POST' && path.endsWith('/shared/generate-token')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const userId = user.id;
    const userDoc = await firestore.collection('users').doc(String(userId)).get();
    const username = userDoc.exists ? userDoc.data()?.username : '';
    const raw = `${username}:${userId}:${Date.now()}:${Math.random()}`;
    const token = crypto.createHash('sha256').update(raw).digest('hex');
    await firestore.collection('shared_accounts_tokens').doc(String(userId)).set({ userId, token });
    return { statusCode: 200, body: JSON.stringify({ token }) };
  }

  // POST /api/shared/use-token
  if (method === 'POST' && path.endsWith('/shared/use-token')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const sharedWithUserId = user.id;
    const { token } = body;
    const tokenSnap = await firestore.collection('shared_accounts_tokens').where('token', '==', token).get();
    if (tokenSnap.empty) return { statusCode: 400, body: JSON.stringify({ error: 'Token inválido' }) };
    const userId = tokenSnap.docs[0].data().userId;
    if (userId === sharedWithUserId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Não pode mesclar consigo mesmo' }) };
    }
    const linkSnap = await firestore.collection('shared_accounts')
      .where('userId', '==', userId)
      .where('sharedWithUserId', '==', sharedWithUserId)
      .get();
    if (!linkSnap.empty) return { statusCode: 400, body: JSON.stringify({ error: 'Já vinculado' }) };
    await firestore.collection('shared_accounts').add({ userId, sharedWithUserId });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  // GET /api/shared/finances
  if (method === 'GET' && path.endsWith('/shared/finances')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const userId = user.id;
    const sharedSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
    const ids = sharedSnap.docs.map(doc => doc.data().userId);
    const allUserIds = Array.from(new Set([...ids, userId]));
    const accountsSnap = await firestore.collection('accounts').where('userId', 'in', allUserIds).get();
    const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const collabsSnap = await firestore.collection('collaborators').where('userId', 'in', allUserIds).get();
    const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { statusCode: 200, body: JSON.stringify({ accounts, collabs }) };
  }

  // GET /api/shared/links
  if (method === 'GET' && path.endsWith('/shared/links')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const userId = user.id;
    const iSeeSnap = await firestore.collection('shared_accounts').where('userId', '==', userId).get();
    const iSee = iSeeSnap.docs.map(doc => ({ id: doc.data().sharedWithUserId }));
    const seeMeSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
    const seeMe = seeMeSnap.docs.map(doc => ({ id: doc.data().userId }));
    return { statusCode: 200, body: JSON.stringify({ iSee, seeMe }) };
  }

  // DELETE /api/shared/unlink/:otherUserId
  if (method === 'DELETE' && /\/shared\/unlink\/.+/.test(path)) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const idMatch = path.match(/\/shared\/unlink\/(.+)$/);
    const otherUserId = idMatch ? Number(idMatch[1]) : null;
    if (!otherUserId) return { statusCode: 400, body: JSON.stringify({ error: 'ID do usuário não informado' }) };
    const userId = user.id;
    const linksSnap = await firestore.collection('shared_accounts')
      .where('userId', 'in', [userId, otherUserId])
      .where('sharedWithUserId', 'in', [userId, otherUserId])
      .get();
    const batch = firestore.batch();
    linksSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};
