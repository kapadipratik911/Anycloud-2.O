import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        fileId,
        userId,
      },
    });

    res.status(201).json({ favorite });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const favorite = await prisma.favorite.findFirst({
      where: {
        fileId,
        userId,
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

export const getUserFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        file: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filesWithMetadata = favorites.map(fav => ({
      ...fav.file,
      isFavorite: true,
      tags: fav.file.tags.map(ft => ft.tag),
    }));

    res.json({ files: filesWithMetadata });
  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({ error: 'Failed to get user favorites' });
  }
};

export const getRecentFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const recentFiles = await prisma.recentFile.findMany({
      where: { userId },
      include: {
        file: {
          where: { isDeleted: false },
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
            favorites: {
              where: { userId },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const filesWithMetadata = recentFiles
      .filter(rf => rf.file !== null)
      .map(rf => ({
        ...rf.file,
        isFavorite: rf.file.favorites.length > 0,
        tags: rf.file.tags.map(ft => ft.tag),
      }));

    res.json({ files: filesWithMetadata });
  } catch (error) {
    console.error('Get recent files error:', error);
    res.status(500).json({ error: 'Failed to get recent files' });
  }
};
