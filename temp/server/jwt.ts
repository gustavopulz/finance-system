
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || '';

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req: any, requiredRole?: 'admin' | 'user') {
  const header = req.headers['authorization'];
  if (!header) return { error: 'Token ausente', status: 401 };
  const token = header.split(' ')[1];
  const decoded: any = verifyToken(token);
  if (!decoded) return { error: 'Token inválido', status: 401 };
  if (requiredRole && decoded.role !== requiredRole)
    return { error: 'Acesso negado', status: 403 };
  return { user: decoded };
}
