import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'PATCH') {
      const { id } = req.query;
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
        return res.json({ id, status: newStatus, cancelledAt });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao atualizar status' });
      }
    }
    res.status(404).json({ error: 'Not found' });
  });
}
