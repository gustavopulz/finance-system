const { firestore } = require('../../backend/src/db');

exports.handler = async function(event) {
  const method = event.httpMethod;
  const path = event.path;
  const headers = event.headers;

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

  // GET /api/dashboard
  if (method === 'GET' && path.endsWith('/dashboard')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const userId = user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const accountsSnap = await firestore.collection('accounts')
      .where('userId', '==', userId)
      .where('month', '==', month)
      .where('year', '==', year)
      .where('status', '==', 'ativo')
      .get();
    const accounts = accountsSnap.docs.map(doc => doc.data());
    const total = accounts.reduce((sum, acc) => sum + (acc.value || 0), 0);

    const origemTotals = {};
    accounts.forEach(acc => {
      if (acc.origem) {
        origemTotals[acc.origem] = (origemTotals[acc.origem] || 0) + (acc.value || 0);
      }
    });

    const responsavelTotals = {};
    accounts.forEach(acc => {
      if (acc.responsavel) {
        responsavelTotals[acc.responsavel] = (responsavelTotals[acc.responsavel] || 0) + (acc.value || 0);
      }
    });

    const salarySnap = await firestore.collection('salary')
      .where('userId', '==', userId)
      .where('month', '==', month)
      .where('year', '==', year)
      .get();
    const salary = salarySnap.empty ? null : salarySnap.docs[0].data().value;

    return {
      statusCode: 200,
      body: JSON.stringify({
        total,
        origem: origemTotals,
        responsavel: responsavelTotals,
        salary,
        month,
        year,
      })
    };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};
