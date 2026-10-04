import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  username?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const attachUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId) {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (user) {
        req.username = user.username;
      }
    }
    next();
  } catch (error) {
    next();
  }
};
