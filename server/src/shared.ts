import { Router } from 'express';
import { firestore } from './db';
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
  // Firestore: Get username
  const userDoc = await firestore.collection('users').doc(String(userId)).get();
  const username = userDoc.exists ? userDoc.data()?.username : '';
  const raw = `${username}:${userId}:${Date.now()}:${Math.random()}`;
  const token = crypto.createHash('sha256').update(raw).digest('hex');
  // Save token in shared_accounts_tokens collection
  await firestore.collection('shared_accounts_tokens').doc(String(userId)).set({ userId, token });
  res.json({ token });
});

// Usar token para vincular contas (unidirecional)
router.post('/use-token', auth(), async (req: any, res) => {
  const sharedWithUserId = req.user.id;
  const { token } = req.body;
  // Firestore: Get userId by token
  const tokenSnap = await firestore.collection('shared_accounts_tokens').where('token', '==', token).get();
  if (tokenSnap.empty) return res.status(400).json({ error: 'Token inválido' });
  const userId = tokenSnap.docs[0].data().userId;
  if (userId === sharedWithUserId) {
    return res.status(400).json({ error: 'Não pode mesclar consigo mesmo' });
  }
  // Firestore: Check if link exists
  const linkSnap = await firestore.collection('shared_accounts')
    .where('userId', '==', userId)
    .where('sharedWithUserId', '==', sharedWithUserId)
    .get();
  if (!linkSnap.empty) return res.status(400).json({ error: 'Já vinculado' });
  // Create link
  await firestore.collection('shared_accounts').add({ userId, sharedWithUserId });
  res.json({ success: true });
});

// Listar dados mesclados (colaboradores, contas, etc)
router.get('/finances', auth(), async (req: any, res) => {
  const userId = req.user.id;
  // Firestore: Get all userIds that shared with logged user
  const sharedSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
  const ids = sharedSnap.docs.map(doc => doc.data().userId);
  const allUserIds = Array.from(new Set([...ids, userId]));

  // Get accounts
  const accountsSnap = await firestore.collection('accounts').where('userId', 'in', allUserIds).get();
  const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Get collaborators
  const collabsSnap = await firestore.collection('collaborators').where('userId', 'in', allUserIds).get();
  const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json({ accounts, collabs });
});

// Listar vínculos do usuário logado
router.get('/links', auth(), async (req: any, res) => {
  const userId = req.user.id;
  // Firestore: Get links
  const iSeeSnap = await firestore.collection('shared_accounts').where('userId', '==', userId).get();
  const iSee = iSeeSnap.docs.map(doc => ({ id: doc.data().sharedWithUserId }));
  const seeMeSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
  const seeMe = seeMeSnap.docs.map(doc => ({ id: doc.data().userId }));
  res.json({ iSee, seeMe });
});

// Desvincular (remover apenas um sentido)
router.delete('/unlink/:otherUserId', auth(), async (req: any, res) => {
  const userId = req.user.id;
  const otherUserId = Number(req.params.otherUserId);
  // Firestore: Remove links in both directions
  const linksSnap = await firestore.collection('shared_accounts')
    .where('userId', 'in', [userId, otherUserId])
    .where('sharedWithUserId', 'in', [userId, otherUserId])
    .get();
  const batch = firestore.batch();
  linksSnap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  res.json({ success: true });
});

export default router;
