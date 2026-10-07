import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        quotaMb: true,
        createdAt: true,
        _count: {
          select: { files: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add storage info for each user
    const fs = require('fs');
    const path = require('path');
    const usersWithStorage = users.map((user: any) => {
      const userDir = path.join(process.env.UPLOAD_DIR || './uploads', user.username);
      let storageUsed = 0;
      if (fs.existsSync(userDir)) {
        const calculateSize = (dir: string): number => {
          let size = 0;
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              size += calculateSize(filePath);
            } else {
              size += stats.size / (1024 * 1024);
            }
          }
          return size;
        };
        storageUsed = calculateSize(userDir);
      }

      return {
        ...user,
        storageUsed: Math.round(storageUsed * 100) / 100,
        storagePercent: Math.min(100, Math.round((storageUsed / user.quotaMb) * 100)),
      };
    });

    res.json({ users: usersWithStorage });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserQuota = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { quota } = req.body;

    const user = await prisma.user.update({
      where: { username },
      data: { quotaMb: quota },
    });

    // Log the quota update
    await prisma.log.create({
      data: {
        userId: req.userId!,
        action: 'update_quota',
        details: `Updated quota for ${username} to ${quota}MB`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Quota updated successfully', user });
  } catch (error) {
    console.error('Update quota error:', error);
    res.status(500).json({ error: 'Failed to update quota' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user files from disk
    const fs = require('fs');
    const path = require('path');
    const userDir = path.join(process.env.UPLOAD_DIR || './uploads', username);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }

    // Delete user from database (cascade will delete related records)
    await prisma.user.delete({
      where: { username },
    });

    // Log the deletion
    await prisma.log.create({
      data: {
        userId: req.userId!,
        action: 'delete_user',
        details: `Deleted user ${username}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

export const getVisitorStats = async (req: any, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setDate(now.getDate() - 30));

    const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
      prisma.visit.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.visit.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.visit.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.visit.count(),
    ]);

    // Daily visits for last 7 days
    const dailyData = [];
    const dailyLabels = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const count = await prisma.visit.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      });
      
      dailyData.push(count);
      dailyLabels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    res.json({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: totalCount,
      dailyData,
      dailyLabels,
    });
  } catch (error) {
    console.error('Get visitor stats error:', error);
    res.status(500).json({ error: 'Failed to fetch visitor stats' });
  }
};

export const trackVisit = async (req: any, res: Response) => {
  try {
    await prisma.visit.create({
      data: {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent')?.slice(0, 100),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track visit error:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
};
