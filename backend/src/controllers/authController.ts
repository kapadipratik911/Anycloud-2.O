import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'user',
      },
    });

    // Create user directory
    const fs = require('fs');
    const path = require('path');
    const userDir = path.join(config.uploadDir, username);
    fs.mkdirSync(userDir, { recursive: true });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] }
    );

    // Log the login
    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'login',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        role: true,
        quotaMb: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate storage used
    const fs = require('fs');
    const path = require('path');
    const userDir = path.join(config.uploadDir, user.username);
    
    let storageUsed = 0;
    if (fs.existsSync(userDir)) {
      const calculateSize = (dir: string) => {
        let size = 0;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            size += calculateSize(filePath);
          } else {
            size += stats.size;
          }
        }
        return size;
      };
      storageUsed = calculateSize(userDir);
    }

    const storageUsedMb = Math.round(storageUsed / (1024 * 1024) * 100) / 100;
    const storagePercent = Math.min(100, Math.round((storageUsedMb / user.quotaMb) * 100));

    res.json({
      user,
      storage: {
        used: storageUsedMb,
        quota: user.quotaMb,
        percent: storagePercent,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
