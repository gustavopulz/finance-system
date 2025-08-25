import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });
      await firestore.collection('collaborators').doc(id).delete();
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Not found' });
  });
}
