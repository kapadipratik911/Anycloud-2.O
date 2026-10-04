import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createShare = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.body;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const token = uuidv4().slice(0, 8);

    const share = await prisma.share.create({
      data: {
        token,
        fileId,
        filePath: file.path,
        userId,
      },
    });

    // Log the share creation
    await prisma.log.create({
      data: {
        userId,
        action: 'share',
        details: `Created share link for ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      message: 'Share link created',
      shareUrl: `/share/${token}`,
      token,
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
};

export const getSharedFile = async (req: any, res: Response) => {
  try {
    const { token } = req.params;

    const share = await prisma.share.findUnique({
      where: { token },
    });

    if (!share) {
      return res.status(404).json({ error: 'Invalid share link' });
    }

    const file = await prisma.file.findUnique({
      where: { id: share.fileId },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment download count
    await prisma.share.update({
      where: { id: share.id },
      data: { downloads: { increment: 1 } },
    });

    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('Get shared file error:', error);
    res.status(500).json({ error: 'Failed to download shared file' });
  }
};

export const getUserShares = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const shares = await prisma.share.findMany({
      where: { userId },
      include: {
        file: {
          select: {
            originalName: true,
            size: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ shares });
  } catch (error) {
    console.error('Get user shares error:', error);
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
};

export const deleteShare = async (req: AuthRequest, res: Response) => {
  try {
    const { shareId } = req.params;
    const userId = req.userId!;

    const share = await prisma.share.findFirst({
      where: { id: shareId, userId },
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    await prisma.share.delete({
      where: { id: shareId },
    });

    // Log the share deletion
    await prisma.log.create({
      data: {
        userId,
        action: 'delete_share',
        details: `Deleted share link`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Share link deleted' });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({ error: 'Failed to delete share link' });
  }
};
