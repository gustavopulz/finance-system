// 📂 lib/users.ts
import { initFirestore, firestore } from './firestore';

export interface UserData {
  id: string;
  name?: string;
  role: 'admin' | 'user';
  email?: string;
  password?: string;
  [key: string]: any;
}

export async function getUserFromFirestore(id: string): Promise<UserData | null> {
  await initFirestore();
  const userDoc = await firestore.collection('users').doc(id).get();

  if (!userDoc.exists) return null;
  const data = userDoc.data() || {};

  return {
    id: userDoc.id,
    role: data.role === 'admin' || data.role === 'user' ? data.role : 'user',
    ...data,
  } as UserData;
}
