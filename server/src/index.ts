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
app.get('/api/collabs', auth(), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM collaborators ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/collabs', auth(), async (req, res) => {
  const { nome } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  try {
    const [result]: any = await db.query(
      'INSERT INTO collaborators (name) VALUES (?)',
      [nome.trim()]
    );
    res.json({ id: result.insertId, name: nome.trim() });
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
app.get('/api/accounts', auth(), async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    const [rows] = await db.query('SELECT * FROM accounts ORDER BY id DESC');
    return res.json(rows);
  }

  // devolve apenas contas a partir do mês/ano informado
  const [rows] = await db.query(
    `SELECT * 
     FROM accounts 
     WHERE (year > ? OR (year = ? AND month >= ?))
     ORDER BY id DESC`,
    [year, year, month]
  );

  res.json(rows);
});

app.post('/api/accounts', auth(), async (req, res) => {
  const {
    collaboratorId,
    description,
    value,
    parcelasTotal,
    month,
    year,
    status,
  } = req.body;

  if (!collaboratorId || !description || !value || !month || !year) {
    return res
      .status(400)
      .json({ error: 'Preencha todos os campos obrigatórios' });
  }

  const [result]: any = await db.query(
    'INSERT INTO accounts (collaboratorId, description, value, parcelasTotal, month, year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      collaboratorId,
      description.trim(),
      value,
      parcelasTotal,
      month,
      year,
      status || 'ativo',
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
  } = req.body;

  try {
    await db.query(
      `UPDATE accounts 
       SET collaboratorId=?, description=?, value=?, parcelasTotal=?, month=?, year=?, status=? 
       WHERE id=?`,
      [
        collaboratorId,
        description.trim(),
        value,
        parcelasTotal,
        month,
        year,
        status,
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
    const newStatus = currentStatus === 'cancelado' ? 'ativo' : 'cancelado';

    await db.query('UPDATE accounts SET status = ? WHERE id = ?', [
      newStatus,
      id,
    ]);

    res.json({ id, status: newStatus });
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
