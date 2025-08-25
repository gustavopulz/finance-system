import crypto from 'crypto';
import { firestore } from './db';

export async function generateShareToken(userId: string, username: string) {
  const raw = `${username}:${userId}:${Date.now()}:${Math.random()}`;
  const token = crypto.createHash('sha256').update(raw).digest('hex');
  await firestore.collection('shared_accounts_tokens').doc(String(userId)).set({ userId, token });
  return token;
}

export async function useShareToken(sharedWithUserId: string, token: string) {
  const tokenSnap = await firestore.collection('shared_accounts_tokens').where('token', '==', token).get();
  if (tokenSnap.empty) return { error: 'Token inválido' };
  const userId = tokenSnap.docs[0].data().userId;
  if (userId === sharedWithUserId) {
    return { error: 'Não pode mesclar consigo mesmo' };
  }
  const linkSnap = await firestore.collection('shared_accounts')
    .where('userId', '==', userId)
    .where('sharedWithUserId', '==', sharedWithUserId)
    .get();
  if (!linkSnap.empty) return { error: 'Já vinculado' };
  await firestore.collection('shared_accounts').add({ userId, sharedWithUserId });
  return { success: true };
}

export async function getSharedFinances(userId: string) {
  const sharedSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
  const ids = sharedSnap.docs.map(doc => doc.data().userId);
  const allUserIds = Array.from(new Set([...ids, userId]));
  const accountsSnap = await firestore.collection('accounts').where('userId', 'in', allUserIds).get();
  const accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const collabsSnap = await firestore.collection('collaborators').where('userId', 'in', allUserIds).get();
  const collabs = collabsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { accounts, collabs };
}

export async function getShareLinks(userId: string) {
  const iSeeSnap = await firestore.collection('shared_accounts').where('userId', '==', userId).get();
  const iSee = iSeeSnap.docs.map(doc => ({ id: doc.data().sharedWithUserId }));
  const seeMeSnap = await firestore.collection('shared_accounts').where('sharedWithUserId', '==', userId).get();
  const seeMe = seeMeSnap.docs.map(doc => ({ id: doc.data().userId }));
  return { iSee, seeMe };
}

export async function unlinkShare(userId: string, otherUserId: string) {
  const linksSnap = await firestore.collection('shared_accounts')
    .where('userId', 'in', [userId, otherUserId])
    .where('sharedWithUserId', 'in', [userId, otherUserId])
    .get();
  const batch = firestore.batch();
  linksSnap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return { success: true };
}
