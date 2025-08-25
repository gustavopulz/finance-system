
import { initFirestore } from './db.js';
import './routes.js';
import 'dotenv/config';

(async () => {
  await initFirestore();
})();
