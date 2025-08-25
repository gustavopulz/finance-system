import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'DELETE') {
      const { id } = req.query;
      try {
        await firestore.collection('accounts').doc(id).delete();
        return res.json({ success: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao excluir conta' });
      }
    }
    res.status(404).json({ error: 'Not found' });
  });
}
