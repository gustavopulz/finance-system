const { firestore } = require('../../backend/src/db');

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

  // GET /api/salary
  if (method === 'GET' && path.endsWith('/salary')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const { month, year } = query;
    let salarySnap;
    if (month && year) {
      salarySnap = await firestore.collection('salary')
        .where('userId', '==', user.id)
        .where('month', '==', Number(month))
        .where('year', '==', Number(year))
        .get();
    } else {
      salarySnap = await firestore.collection('salary')
        .where('userId', '==', user.id)
        .get();
    }
    const salaries = salarySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { statusCode: 200, body: JSON.stringify(salaries) };
  }

  // POST /api/salary
  if (method === 'POST' && path.endsWith('/salary')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const { value, month, year } = body;
    if (!value || !month || !year) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Preencha todos os campos' }) };
    }
    const salarySnap = await firestore.collection('salary')
      .where('userId', '==', user.id)
      .where('month', '==', Number(month))
      .where('year', '==', Number(year))
      .get();
    if (!salarySnap.empty) {
      const salaryDoc = salarySnap.docs[0];
      await firestore.collection('salary').doc(salaryDoc.id).update({ value });
      return { statusCode: 200, body: JSON.stringify({ success: true, updated: true }) };
    }
    await firestore.collection('salary').add({ userId: user.id, value, month: Number(month), year: Number(year) });
    return { statusCode: 200, body: JSON.stringify({ success: true, created: true }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};
