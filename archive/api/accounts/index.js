import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'GET') {
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
      return res.json(accounts);
    }
    if (req.method === 'POST') {
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
      return res.json({
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
    }
    res.status(404).json({ error: 'Not found' });
  });
}
