import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'PUT') {
      const { id } = req.query;
      const payload = req.body || {};
      try {
        const updateData = {};
        for (const key in payload) {
          if (Object.prototype.hasOwnProperty.call(payload, key)) {
            if (key === 'description' && typeof payload[key] === 'string') {
              updateData[key] = payload[key].trim();
            } else if ((key === 'origem' || key === 'responsavel') && payload[key] === '') {
              updateData[key] = null;
            } else {
              updateData[key] = payload[key];
            }
          }
        }
        await firestore.collection('accounts').doc(id).update(updateData);
        return res.json({ success: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao atualizar conta', details: err.message });
      }
    }
    res.status(404).json({ error: 'Not found' });
  });
}
