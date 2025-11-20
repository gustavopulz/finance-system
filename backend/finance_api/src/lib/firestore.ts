import admin from 'firebase-admin';

let firestore: admin.firestore.Firestore;

export async function initFirestore() {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
  }
  let serviceAccountJson: string;
  try {
    serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
  } catch (err) {
    throw new Error('Failed to decode base64 service account: ' + err);
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (err) {
    throw new Error('Service account JSON is invalid: ' + err);
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  firestore = admin.firestore();
}

export { firestore };
