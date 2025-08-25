import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string, requiredRole?: 'admin' | 'user') {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (requiredRole && decoded.role !== requiredRole) {
      throw new Error('Acesso negado');
    }
    return decoded;
  } catch {
    throw new Error('Token inválido');
  }
}
