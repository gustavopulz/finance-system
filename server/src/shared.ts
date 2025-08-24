import { Router } from 'express';
import { db } from './db';
import jwt from 'jsonwebtoken';

// Copia do index.ts
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

// Gerar token de compartilhamento
router.post('/generate-token', auth(), async (req: any, res) => {
  const userId = req.user.id;
  res.json({ token: userId.toString() });
});

// Usar token para vincular contas
router.post('/use-token', auth(), async (req: any, res) => {
  const sharedWithUserId = req.user.id;
  const { token } = req.body;
  const userId = parseInt(token, 10);
  if (!userId || userId === sharedWithUserId) {
    return res.status(400).json({ error: 'Token inválido' });
  }
  const [exists]: any = await db.query(
    'SELECT * FROM shared_accounts WHERE userId = ? AND sharedWithUserId = ?',
    [userId, sharedWithUserId]
  );
  if (exists.length) return res.status(400).json({ error: 'Já vinculado' });
  await db.query(
    'INSERT INTO shared_accounts (userId, sharedWithUserId) VALUES (?, ?)',
    [userId, sharedWithUserId]
  );
  res.json({ success: true });
});

// Listar contas mescladas
router.get('/finances', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const [own] = await db.query('SELECT * FROM accounts WHERE userId = ?', [
    userId,
  ]);
  const [sharedRows] = await db.query(
    'SELECT userId FROM shared_accounts WHERE sharedWithUserId = ?',
    [userId]
  );
  const sharedUserIds = (sharedRows as any[]).map((s: any) => s.userId);
  let sharedFinances: any[] = [];
  if (sharedUserIds.length) {
    const [rows] = await db.query(
      `SELECT a.*, u.username as owner FROM accounts a JOIN users u ON a.userId = u.id WHERE a.userId IN (?)`,
      [sharedUserIds]
    );
    sharedFinances = rows as any[];
  }
  res.json({ own, shared: sharedFinances });
});

export default router;
