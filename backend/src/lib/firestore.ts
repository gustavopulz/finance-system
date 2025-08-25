import admin from 'firebase-admin';

let firestore: admin.firestore.Firestore;

export async function initFirestore() {
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
}

export { firestore };
