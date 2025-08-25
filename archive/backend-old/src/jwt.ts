import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const JWT_SECRET = process.env.JWT_SECRET!;

export function auth(requiredRole?: 'admin' | 'user') {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'Token ausente' });
    const token = header.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (requiredRole && decoded.role !== requiredRole)
        return res.status(403).json({ error: 'Acesso negado' });
      (req as any).user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}
