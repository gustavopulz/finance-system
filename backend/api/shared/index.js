import { firestore } from '../../src/db.js';
import crypto from 'crypto';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'POST' && req.url.endsWith('/generate-token')) {
      const userId = req.user.id;
      const userDoc = await firestore.collection('users').doc(String(userId)).get();
      const username = userDoc.exists ? userDoc.data()?.username : '';
      const raw = `${username}:${userId}:${Date.now()}:${Math.random()}`;
      const token = crypto.createHash('sha256').update(raw).digest('hex');
      await firestore.collection('shared_accounts_tokens').doc(String(userId)).set({ userId, token });
      return res.json({ token });
    }
    if (req.method === 'POST' && req.url.endsWith('/use-token')) {
      const sharedWithUserId = req.user.id;
      const { token } = req.body;
      const tokenSnap = await firestore.collection('shared_accounts_tokens').where('token', '==', token).get();
      if (tokenSnap.empty) return res.status(400).json({ error: 'Token inválido' });
      const userId = tokenSnap.docs[0].data().userId;
      if (userId === sharedWithUserId) {
        return res.status(400).json({ error: 'Não pode mesclar consigo mesmo' });
      }
      const linkSnap = await firestore.collection('shared_accounts')
        .where('userId', '==', userId)
        .where('sharedWithUserId', '==', sharedWithUserId)
        .get();
      if (!linkSnap.empty) return res.status(400).json({ error: 'Já vinculado' });
      await firestore.collection('shared_accounts').add({ userId, sharedWithUserId });
      return res.json({ success: true });
    }
    if (req.method === 'GET' && req.url.endsWith('/finances')) {
      const userId = req.user.id;
      const sharedSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
      const ids = sharedSnap.docs.map(doc => doc.data().userId);
      const allUserIds = Array.from(new Set([...ids, userId]));
      const accountsSnap = await firestore.collection('accounts').where('userId', 'in', allUserIds).get();
      const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const collabsSnap = await firestore.collection('collaborators').where('userId', 'in', allUserIds).get();
      const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ accounts, collabs });
    }
    if (req.method === 'GET' && req.url.endsWith('/links')) {
      const userId = req.user.id;
      const iSeeSnap = await firestore.collection('shared_accounts').where('userId', '==', userId).get();
      const iSee = iSeeSnap.docs.map(doc => ({ id: doc.data().sharedWithUserId }));
      const seeMeSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
      const seeMe = seeMeSnap.docs.map(doc => ({ id: doc.data().userId }));
      return res.json({ iSee, seeMe });
    }
    if (req.method === 'DELETE' && req.url.includes('/unlink/')) {
      const userId = req.user.id;
      const otherUserId = Number(req.query.otherUserId);
      const linksSnap = await firestore.collection('shared_accounts')
        .where('userId', 'in', [userId, otherUserId])
        .where('sharedWithUserId', 'in', [userId, otherUserId])
        .get();
      const batch = firestore.batch();
      linksSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Not found' });
  });
}
