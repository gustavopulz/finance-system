import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = 'segredo_super_secreto'; // ⚠️ coloque em variável de ambiente depois

// -------------------------
// Middleware de autenticação
// -------------------------
function auth(requiredRole?: 'admin' | 'user') {
  return (req: any, res: any, next: any) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'Token ausente' });

    const token = header.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (requiredRole && decoded.role !== requiredRole)
        return res.status(403).json({ error: 'Acesso negado' });
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

// -------------------------
// Rotas de Usuários (Admin)
// -------------------------
app.get('/api/users', auth('admin'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, username, role FROM users ORDER BY id DESC'
  );
  res.json(rows);
});

app.post('/api/users', auth('admin'), async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result]: any = await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username.trim(), hash, role || 'user']
    );
    res.json({ id: result.insertId, username, role: role || 'user' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// -------------------------
// Login
// -------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

  const [rows]: any = await db.query('SELECT * FROM users WHERE username = ?', [
    username,
  ]);
  if (!rows.length)
    return res.status(401).json({ error: 'Credenciais inválidas' });

  const user = rows[0];
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
});

// -------------------------
// Rotas de Colaboradores
// -------------------------
app.get('/api/collabs', auth(), async (req: any, res) => {
  // userId pode vir do query ou do token
  const userId = Number(req.query.userId) || req.user.id;
  const [rows] = await db.query(
    'SELECT * FROM collaborators WHERE userId = ? ORDER BY id DESC',
    [userId]
  );
  res.json(rows);
});

app.post('/api/collabs', auth(), async (req: any, res) => {
  const { nome, userId } = req.body;
  const uid = userId || req.user.id;
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  try {
    const [result]: any = await db.query(
      'INSERT INTO collaborators (name, userId) VALUES (?, ?)',
      [nome.trim(), uid]
    );
    res.json({ id: result.insertId, name: nome.trim(), userId: uid });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res
        .status(400)
        .json({ error: 'Já existe um colaborador com esse nome' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao adicionar colaborador' });
  }
});

app.delete('/api/collabs/:id', auth(), async (req, res) => {
  const id = Number(req.params.id);
  await db.query('DELETE FROM collaborators WHERE id = ?', [id]);
  res.json({ success: true });
});

// -------------------------
// Rotas de Contas
// -------------------------
app.get('/api/accounts', auth(), async (req: any, res) => {
  const { month, year, userId } = req.query;
  const uid = Number(userId) || req.user.id;
  let rows;
  if (!month || !year) {
    [rows] = await db.query(
      'SELECT * FROM accounts WHERE userId = ? ORDER BY id DESC',
      [uid]
    );
    return res.json(rows);
  }
  [rows] = await db.query(
    `SELECT * 
     FROM accounts 
     WHERE userId = ? AND (year > ? OR (year = ? AND month >= ?))
     ORDER BY id DESC`,
    [uid, year, year, month]
  );
  res.json(rows);
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
  } = req.body;
  const uid = userId || req.user.id;
  if (!collaboratorId || !description || !value || !month || !year) {
    return res
      .status(400)
      .json({ error: 'Preencha todos os campos obrigatórios' });
  }
  const [result]: any = await db.query(
    'INSERT INTO accounts (collaboratorId, description, value, parcelasTotal, month, year, status, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      collaboratorId,
      description.trim(),
      value,
      parcelasTotal,
      month,
      year,
      status || 'ativo',
      uid,
    ]
  );
  res.json({
    id: result.insertId,
    collaboratorId,
    description,
    value,
    parcelasTotal,
    month,
    year,
    status: status || 'ativo',
    userId: uid,
  });
});

// Atualizar conta (edição)
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
    cancelledAt, // <-- ADICIONADO
  } = req.body;

  try {
    await db.query(
      `UPDATE accounts 
       SET collaboratorId=?, description=?, value=?, parcelasTotal=?, month=?, year=?, status=?, cancelledAt=? 
       WHERE id=?`,
      [
        collaboratorId,
        description.trim(),
        value,
        parcelasTotal,
        month,
        year,
        status,
        cancelledAt, // <-- ADICIONADO
        id,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar conta' });
  }
});

// Alternar status cancelado/ativo
app.patch('/api/accounts/:id/toggle-cancel', auth(), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await db.query(
      'SELECT status FROM accounts WHERE id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const currentStatus = rows[0].status;
    let newStatus, cancelledAt;

    if (currentStatus === 'cancelado') {
      newStatus = 'ativo';
      cancelledAt = null;
      await db.query(
        'UPDATE accounts SET status = ?, cancelledAt = NULL WHERE id = ?',
        [newStatus, id]
      );
    } else {
      newStatus = 'cancelado';
      // Permite que o frontend envie o mês/ano do cancelamento
      const { month, year } = req.body;
      let cancelledYear, cancelledMonth;
      if (month && year) {
        cancelledYear = Number(year);
        cancelledMonth = Number(month);
      } else {
        // fallback para data atual do sistema
        const now = new Date();
        cancelledYear = now.getFullYear();
        cancelledMonth = now.getMonth() + 1;
      }
      cancelledAt = new Date(
        cancelledYear,
        cancelledMonth - 1,
        1
      ).toISOString();
      await db.query(
        'UPDATE accounts SET status = ?, cancelledAt = ? WHERE id = ?',
        [newStatus, cancelledAt, id]
      );
    }

    res.json({ id, status: newStatus, cancelledAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Deletar conta
app.delete('/api/accounts/:id', auth(), async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM accounts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
});

// -------------------------
// Start
// -------------------------
app.listen(PORT, () => {
  console.log(`✅ Server rodando em http://localhost:${PORT}`);
});
