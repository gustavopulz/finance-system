import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'GET') {
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
      return res.json({
        total,
        origem: origemTotals,
        responsavel: responsavelTotals,
        salary,
        month,
        year,
      });
    }
    res.status(404).json({ error: 'Not found' });
  });
}
