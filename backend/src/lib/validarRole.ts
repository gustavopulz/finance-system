import { firestore } from './firestore';

/**
 * Verifica se o role do usuário no Firestore corresponde ao role informado.
 * @param userId ID do usuário a ser verificado
 * @param requiredRole Role esperado ('admin' ou 'user')
 * @returns boolean indicando se o usuário possui o role informado
 */
export async function validarRole(userId: string, requiredRole: 'admin' | 'user'): Promise<boolean> {
	const userDoc = await firestore.collection('users').doc(userId).get();
	if (!userDoc.exists) {
		throw new Error('Usuário não encontrado');
	}
	const userData = userDoc.data();
	if (userData?.role === requiredRole) {
		return true;
	}
	throw new Error('Usuário não possui o role necessário');
}
