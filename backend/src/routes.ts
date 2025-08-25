import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { initFirestore, firestore } from './db.js';
import { auth, JWT_SECRET } from './jwt.js';
import sharedRoutes from './shared.js';
import 'dotenv/config';

const app = express();
const PORT = 4000;

(async () => {
  await initFirestore();
})();

app.use(cors());
app.use(express.json());

// -------------------------
// Rotas de Usuários (Admin)
app.patch('/api/users/me', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const { username } = req.body;
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  await firestore.collection('users').doc(String(userId)).update({ username: username.trim() });
  res.json({ success: true, username: username.trim() });
});

app.patch('/api/users/me/password', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Senha deve ter ao menos 4 caracteres' });
  }
  const hash = await bcrypt.hash(password, 10);
  await firestore.collection('users').doc(String(userId)).update({ password: hash });
  res.json({ success: true });
});

app.get('/api/users', auth('admin'), async (req, res) => {
  const usersSnap = await firestore.collection('users').get();
  const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(users);
});

app.post('/api/users', auth('admin'), async (req, res) => {
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
    res.json({ id: userRef.id, username, role: role || 'user' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// -------------------------
// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

  const userSnap = await firestore.collection('users').where('username', '==', username).get();
  if (userSnap.empty)
    return res.status(401).json({ error: 'Credenciais inválidas' });

  const userDoc = userSnap.docs[0];
  const userData = userDoc.data();
  const user = { id: userDoc.id, username: userData.username, password: userData.password, role: userData.role };
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = require('jsonwebtoken').sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// -------------------------
// Rotas de Colaboradores
app.get('/api/collabs', auth(), async (req: any, res) => {
  const userId = req.query.userId || req.user.id;
  const collabsSnap = await firestore.collection('collaborators').where('userId', '==', userId).get();
  const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(collabs);
});

app.post('/api/collabs', auth(), async (req: any, res) => {
  const { nome, userId } = req.body;
  const uid = userId || req.user.id;
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  try {
    const existingSnap = await firestore.collection('collaborators').where('userId', '==', uid).where('name', '==', nome.trim()).get();
    if (!existingSnap.empty) {
      return res.status(400).json({ error: 'Já existe um colaborador com esse nome' });
    }
    const collabRef = await firestore.collection('collaborators').add({ name: nome.trim(), userId: uid });
    res.json({ id: collabRef.id, name: nome.trim(), userId: uid });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao adicionar colaborador' });
  }
});

app.delete('/api/collabs/:id', auth(), async (req, res) => {
  const id = req.params.id;
  await firestore.collection('collaborators').doc(id).delete();
  res.json({ success: true });
});

// -------------------------
// Rotas de Contas
app.get('/api/accounts', auth(), async (req: any, res) => {
  const { month, year, userId } = req.query;
  const uid = userId || req.user.id;
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
  res.json(accounts);
});

app.post('/api/accounts', auth(), async (req: any, res) => {
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
  } = req.body;
  const uid = userId || req.user.id;
  if (!collaboratorId || !description || !value || !month || !year) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
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
  res.json({
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
  });
});

app.put('/api/accounts/:id', auth(), async (req, res) => {
  const { id } = req.params;
  const {
    collaboratorId,
    description,
    value,
    parcelasTotal,
    month,
    year,
    status,
    cancelledAt,
    origem,
    responsavel,
  } = req.body;

  try {
    await firestore.collection('accounts').doc(id).update({
      collaboratorId,
      description: description.trim(),
      value,
      parcelasTotal,
      month,
      year,
      status,
      cancelledAt,
      origem: origem || null,
      responsavel: responsavel || null,
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar conta' });
  }
});

app.get('/api/dashboard', auth(), async (req: any, res) => {
  const userId = req.user.id;
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

  const origemTotals: Record<string, number> = {};
  accounts.forEach(acc => {
    if (acc.origem) {
      origemTotals[acc.origem] = (origemTotals[acc.origem] || 0) + (acc.value || 0);
    }
  });

  const responsavelTotals: Record<string, number> = {};
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

  res.json({
    total,
    origem: origemTotals,
    responsavel: responsavelTotals,
    salary,
    month,
    year,
  });
});

app.get('/api/salary', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;
  let salarySnap;
  if (month && year) {
    salarySnap = await firestore.collection('salary')
      .where('userId', '==', userId)
      .where('month', '==', Number(month))
      .where('year', '==', Number(year))
      .get();
  } else {
    salarySnap = await firestore.collection('salary')
      .where('userId', '==', userId)
      .get();
  }
  const salaries = salarySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(salaries);
});

app.post('/api/salary', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const { value, month, year } = req.body;
  if (!value || !month || !year) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }
  const salarySnap = await firestore.collection('salary')
    .where('userId', '==', userId)
    .where('month', '==', Number(month))
    .where('year', '==', Number(year))
    .get();
  if (!salarySnap.empty) {
    const salaryDoc = salarySnap.docs[0];
    await firestore.collection('salary').doc(salaryDoc.id).update({ value });
    return res.json({ success: true, updated: true });
  }
  await firestore.collection('salary').add({ userId, value, month: Number(month), year: Number(year) });
  res.json({ success: true, created: true });
});

app.patch('/api/accounts/:id/toggle-cancel', auth(), async (req, res) => {
  const { id } = req.params;
  try {
    const accountDoc = await firestore.collection('accounts').doc(id).get();
    if (!accountDoc.exists) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const currentStatus = accountDoc.data()?.status;
    let newStatus, cancelledAt;

    if (currentStatus === 'cancelado') {
      newStatus = 'ativo';
      cancelledAt = null;
      await firestore.collection('accounts').doc(id).update({ status: newStatus, cancelledAt: null });
    } else {
      newStatus = 'cancelado';
      const { month, year } = req.body;
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

    res.json({ id, status: newStatus, cancelledAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

app.delete('/api/accounts/:id', auth(), async (req, res) => {
  const { id } = req.params;
  try {
    await firestore.collection('accounts').doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
});

app.use('/api/shared', sharedRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server rodando em http://localhost:${PORT}`);
});
