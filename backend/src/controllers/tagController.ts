import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const { name, color = '#4f46e5' } = req.body;
    const userId = req.userId!;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color,
        userId,
      },
    });

    res.status(201).json({ tag });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

export const getUserTags = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { files: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ tags });
  } catch (error) {
    console.error('Get user tags error:', error);
    res.status(500).json({ error: 'Failed to get user tags' });
  }
};

export const updateTag = async (req: AuthRequest, res: Response) => {
  try {
    const { tagId } = req.params;
    const { name, color } = req.body;
    const userId = req.userId!;

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(name && { name: name.trim() }),
        ...(color && { color }),
      },
    });

    res.json({ tag: updatedTag });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
};

export const deleteTag = async (req: AuthRequest, res: Response) => {
  try {
    const { tagId } = req.params;
    const userId = req.userId!;

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};

export const addTagToFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, tagId } = req.body;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const fileTag = await prisma.fileTag.create({
      data: {
        fileId,
        tagId,
      },
      include: {
        tag: true,
      },
    });

    res.status(201).json({ fileTag });
  } catch (error) {
    console.error('Add tag to file error:', error);
    res.status(500).json({ error: 'Failed to add tag to file' });
  }
};

export const removeTagFromFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, tagId } = req.params;
    const userId = req.userId!;

    const fileTag = await prisma.fileTag.findFirst({
      where: {
        fileId,
        tagId,
      },
      include: {
        file: true,
        tag: true,
      },
    });

    if (!fileTag) {
      return res.status(404).json({ error: 'File tag not found' });
    }

    if (fileTag.file.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.fileTag.delete({
      where: { id: fileTag.id },
    });

    res.json({ message: 'Tag removed from file successfully' });
  } catch (error) {
    console.error('Remove tag from file error:', error);
    res.status(500).json({ error: 'Failed to remove tag from file' });
  }
};

export const getFileTags = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileTags = await prisma.fileTag.findMany({
      where: { fileId },
      include: {
        tag: true,
      },
    });

    res.json({ tags: fileTags.map(ft => ft.tag) });
  } catch (error) {
    console.error('Get file tags error:', error);
    res.status(500).json({ error: 'Failed to get file tags' });
  }
};
