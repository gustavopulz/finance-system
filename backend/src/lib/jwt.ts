import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

// 🎫 Gera Access Token (curta duração)
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// 🎫 Gera Refresh Token (longa duração)
export function generateRefreshToken(payload: { id: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 🔒 Verifica Token (opcionalmente exige role)
export function verifyToken(token: string, requiredRole?: 'admin' | 'user'): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (requiredRole && decoded.role !== requiredRole) {
      throw new Error('Acesso negado');
    }

    return decoded;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    throw new Error('Token inválido');
  }
}
