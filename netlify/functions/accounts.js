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

  // GET /api/accounts
  if (method === 'GET' && path.endsWith('/accounts')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const { month, year, userId } = query;
    const uid = userId || user.id;
    let accountsSnap;
    if (!month || !year) {
      accountsSnap = await firestore.collection('accounts').where('userId', '==', uid).get();
    } else {
      accountsSnap = await firestore.collection('accounts')
        .where('userId', '==', uid)
        .where('year', '>=', Number(year))
        .where('month', '>=', Number(month))
        .get();
    }
    const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { statusCode: 200, body: JSON.stringify(accounts) };
  }

  // POST /api/accounts
  if (method === 'POST' && path.endsWith('/accounts')) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const {
      collaboratorId,
      description,
      value,
      parcelasTotal,
      month,
      year,
      status,
      userId,
      origem,
      responsavel,
    } = body;
    const uid = userId || user.id;
    if (!collaboratorId || !description || !value || !month || !year) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Preencha todos os campos obrigatórios' }) };
    }
    const accountRef = await firestore.collection('accounts').add({
      collaboratorId,
      description: description.trim(),
      value,
      parcelasTotal,
      month,
      year,
      status: status || 'ativo',
      userId: uid,
      origem: origem || null,
      responsavel: responsavel || null,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: accountRef.id,
        collaboratorId,
        description,
        value,
        parcelasTotal,
        month,
        year,
        status: status || 'ativo',
        userId: uid,
        origem,
        responsavel,
      })
    };
  }

  // PUT /api/accounts/:id
  if (method === 'PUT' && /\/accounts\/.+/.test(path)) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const idMatch = path.match(/\/accounts\/(.+)$/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'ID da conta não informado' }) };
    const payload = body || {};
    try {
      const updateData = {};
      for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          if (key === 'description' && typeof payload[key] === 'string') {
            updateData[key] = payload[key].trim();
          } else if ((key === 'origem' || key === 'responsavel') && payload[key] === '') {
            updateData[key] = null;
          } else {
            updateData[key] = payload[key];
          }
        }
      }
      await firestore.collection('accounts').doc(id).update(updateData);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao atualizar conta', details: err.message }) };
    }
  }

  // PATCH /api/accounts/:id/toggle-cancel
  if (method === 'PATCH' && /\/accounts\/.+\/toggle-cancel$/.test(path)) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const idMatch = path.match(/\/accounts\/(.+)\/toggle-cancel$/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'ID da conta não informado' }) };
    try {
      const accountDoc = await firestore.collection('accounts').doc(id).get();
      if (!accountDoc.exists) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Conta não encontrada' }) };
      }
      const currentStatus = accountDoc.data()?.status;
      let newStatus, cancelledAt;
      if (currentStatus === 'cancelado') {
        newStatus = 'ativo';
        cancelledAt = null;
        await firestore.collection('accounts').doc(id).update({ status: newStatus, cancelledAt: null });
      } else {
        newStatus = 'cancelado';
        const { month, year } = body;
        let cancelledYear, cancelledMonth;
        if (month && year) {
          cancelledYear = Number(year);
          cancelledMonth = Number(month);
        } else {
          const now = new Date();
          cancelledYear = now.getFullYear();
          cancelledMonth = now.getMonth() + 1;
        }
        cancelledAt = new Date(
          cancelledYear,
          cancelledMonth - 1,
          1
        ).toISOString();
        await firestore.collection('accounts').doc(id).update({ status: newStatus, cancelledAt });
      }
      return { statusCode: 200, body: JSON.stringify({ id, status: newStatus, cancelledAt }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao atualizar status' }) };
    }
  }

  // DELETE /api/accounts/:id
  if (method === 'DELETE' && /\/accounts\/.+/.test(path)) {
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Token ausente ou inválido' }) };
    const idMatch = path.match(/\/accounts\/(.+)$/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'ID da conta não informado' }) };
    try {
      await firestore.collection('accounts').doc(id).delete();
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao excluir conta' }) };
    }
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Rota não encontrada' }) };
};
