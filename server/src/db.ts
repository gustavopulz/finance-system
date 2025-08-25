import admin from 'firebase-admin';
import 'dotenv/config';

let firestore: admin.firestore.Firestore;

export async function initFirestore() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set.');
  }
  const serviceAccount = (await import(serviceAccountPath)).default;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  firestore = admin.firestore();
}

export { firestore };