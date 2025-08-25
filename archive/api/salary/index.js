import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'GET') {
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
      return res.json(salaries);
    }
    if (req.method === 'POST') {
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
      return res.json({ success: true, created: true });
    }
    res.status(404).json({ error: 'Not found' });
  });
}
