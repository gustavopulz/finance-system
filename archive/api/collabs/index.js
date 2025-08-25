import { firestore } from '../../src/db.js';
import { auth } from '../../src/jwt.js';

export default async function handler(req, res) {
  await auth()(req, res, async () => {
    if (req.method === 'GET') {
      const userId = req.query.userId || req.user.id;
      const collabsSnap = await firestore.collection('collaborators').where('userId', '==', userId).get();
      const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(collabs);
    }
    if (req.method === 'POST') {
      const { nome, userId } = req.body;
      const uid = userId || req.user.id;
      if (!nome || nome.trim() === '') {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      try {
        const existingSnap = await firestore.collection('collaborators').where('userId', '==', uid).where('name', '==', nome.trim()).get();
        if (!existingSnap.empty) {
          return res.status(400).json({ error: 'Já existe um colaborador com esse nome' });
        }
        const collabRef = await firestore.collection('collaborators').add({ name: nome.trim(), userId: uid });
        return res.json({ id: collabRef.id, name: nome.trim(), userId: uid });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao adicionar colaborador' });
      }
    }
    res.status(404).json({ error: 'Not found' });
  });
}
