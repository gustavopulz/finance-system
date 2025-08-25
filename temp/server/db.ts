import admin from 'firebase-admin';
import 'dotenv/config';

let firestore: admin.firestore.Firestore;

export function getFirestore() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set.');
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  firestore = admin.firestore();

  return firestore;
}
export { firestore };