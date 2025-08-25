import admin from 'firebase-admin';
import { initFirestore, firestore } from '../src/db';

await initFirestore();

async function createCollections() {
  // accounts
  await firestore.collection("accounts").add({
    description: "Init document",
    value: 0,
    month: 0,
    year: 0,
    status: "ativo"
  });

  // salary
  await firestore.collection("salary").add({
    value: 0,
    month: 0,
    year: 0
  });

  // collaborators
  await firestore.collection("collaborators").add({
    name: "Init collaborator"
  });

  // shared_accounts
  await firestore.collection("shared_accounts").add({
    userId: "placeholder",
    sharedWithUserId: "placeholder",
    createdAt: admin.firestore.Timestamp.now()
  });

  // shared_accounts_tokens
  await firestore.collection("shared_accounts_tokens").add({
    userId: "placeholder",
    token: "init"
  });

  console.log("Collections created with starter docs ✅");
}

createCollections().catch(console.error);
