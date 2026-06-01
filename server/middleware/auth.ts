import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-key-1337-market';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'user' | 'admin';
    name: string;
    email: string;
  };
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ message: 'Access denied. No authentication token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'user' | 'admin'; name: string; email: string };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || authReq.user.role !== 'admin') {
      res.status(403).json({ message: 'Access forbidden. Admin role required.' });
      return;
    }
    next();
  });
}
