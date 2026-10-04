import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const { content } = req.body;
    const userId = req.userId!;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const file = await prisma.file.findFirst({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const comment = await prisma.fileComment.create({
      data: {
        fileId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const getFileComments = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const comments = await prisma.fileComment.findMany({
      where: { fileId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get file comments error:', error);
    res.status(500).json({ error: 'Failed to get file comments' });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId!;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.fileComment.findFirst({
      where: { id: commentId, userId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const updatedComment = await prisma.fileComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json({ comment: updatedComment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId!;

    const comment = await prisma.fileComment.findFirst({
      where: { id: commentId, userId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await prisma.fileComment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
