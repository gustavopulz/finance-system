import { Router } from 'express';
import { db } from './db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function auth(requiredRole?: 'admin' | 'user') {
  return (req: any, res: any, next: any) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'Token ausente' });
    const token = header.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, 'segredo_super_secreto');
      if (requiredRole && decoded.role !== requiredRole)
        return res.status(403).json({ error: 'Acesso negado' });
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

const router = Router();

// Gerar token de compartilhamento (único e seguro)
router.post('/generate-token', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const [userRows]: any = await db.query(
    'SELECT username FROM users WHERE id = ?',
    [userId]
  );
  const username = userRows[0]?.username || '';
  const raw = `${username}:${userId}:${Date.now()}:${Math.random()}`;
  const token = crypto.createHash('sha256').update(raw).digest('hex');
  // Salva token na tabela shared_accounts_tokens
  await db.query(
    'INSERT INTO shared_accounts_tokens (userId, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token)',
    [userId, token]
  );
  res.json({ token });
});

// Usar token para vincular contas (unidirecional)
router.post('/use-token', auth(), async (req: any, res) => {
  const sharedWithUserId = req.user.id;
  const { token } = req.body;
  // Busca userId pelo token
  const [rows]: any = await db.query(
    'SELECT userId FROM shared_accounts_tokens WHERE token = ?',
    [token]
  );
  if (!rows.length) return res.status(400).json({ error: 'Token inválido' });
  const userId = rows[0].userId;
  if (userId === sharedWithUserId) {
    return res.status(400).json({ error: 'Não pode mesclar consigo mesmo' });
  }
  // Verifica se já existe vínculo
  const [exists]: any = await db.query(
    'SELECT * FROM shared_accounts WHERE userId = ? AND sharedWithUserId = ?',
    [userId, sharedWithUserId]
  );
  if (exists.length) return res.status(400).json({ error: 'Já vinculado' });
  // Cria vínculo apenas do dono para quem usou o token
  await db.query(
    'INSERT INTO shared_accounts (userId, sharedWithUserId) VALUES (?, ?)',

    [userId, sharedWithUserId]
  );
  res.json({ success: true });
});

// Listar dados mesclados (colaboradores, contas, etc)
router.get('/finances', auth(), async (req: any, res) => {
  const userId = req.user.id;
  // Busca todos os userIds que compartilharam com o usuário logado
  const [sharedRows] = await db.query(
    'SELECT userId FROM shared_accounts WHERE sharedWithUserId = ?',
    [userId]
  );
  const ids = (sharedRows as any[]).map((s: any) => s.userId);
  const allUserIds = Array.from(new Set([...ids, userId]));

  // Busca contas
  const [accounts] = await db.query(
    `SELECT a.*, u.username as owner FROM accounts a JOIN users u ON a.userId = u.id WHERE a.userId IN (?)`,
    [allUserIds]
  );
  // Busca colaboradores
  const [collabs] = await db.query(
    `SELECT c.*, u.username as owner FROM collaborators c JOIN users u ON c.userId = u.id WHERE c.userId IN (?)`,
    [allUserIds]
  );
  res.json({ accounts, collabs });
});

// Listar vínculos do usuário logado
router.get('/links', auth(), async (req: any, res) => {
  const userId = req.user.id;
  // Quem eu vejo
  const [iSeeRows] = await db.query(
    'SELECT s.sharedWithUserId as id, u.username FROM shared_accounts s JOIN users u ON s.sharedWithUserId = u.id WHERE s.userId = ?',
    [userId]
  );
  // Quem vê minha conta
  const [seeMeRows] = await db.query(
    'SELECT s.userId as id, u.username FROM shared_accounts s JOIN users u ON s.userId = u.id WHERE s.sharedWithUserId = ?',
    [userId]
  );
  res.json({ iSee: iSeeRows, seeMe: seeMeRows });
});

// Desvincular (remover apenas um sentido)
router.delete('/unlink/:otherUserId', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const otherUserId = Number(req.params.otherUserId);
  // Remove vínculo em ambos os sentidos, se existir
  await db.query(
    'DELETE FROM shared_accounts WHERE (userId = ? AND sharedWithUserId = ?) OR (userId = ? AND sharedWithUserId = ?)',
    [userId, otherUserId, otherUserId, userId]
  );
  res.json({ success: true });
});

export default router;
