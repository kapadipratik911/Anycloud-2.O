import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

export const bulkDelete = async (req: AuthRequest, res: Response) => {
  try {
    const { fileIds } = req.body;
    const userId = req.userId!;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId,
        isDeleted: false,
      },
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found' });
    }

    // Soft delete all files
    await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        userId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Log the bulk delete
    await prisma.log.create({
      data: {
        userId,
        action: 'bulk_delete',
        details: `Bulk deleted ${files.length} files`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: `Successfully moved ${files.length} files to trash` });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete files' });
  }
};

export const bulkMove = async (req: AuthRequest, res: Response) => {
  try {
    const { fileIds, newFolderId } = req.body;
    const userId = req.userId!;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId,
        isDeleted: false,
      },
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found' });
    }

    // Check if new folder exists and belongs to user
    if (newFolderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: newFolderId, userId },
      });

      if (!folder) {
        return res.status(404).json({ error: 'Target folder not found' });
      }

      // Move files physically
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const userDir = path.join(config.uploadDir, user.username);
        const folderPath = path.join(userDir, newFolderId);
        fs.mkdirSync(folderPath, { recursive: true });

        for (const file of files) {
          const newPath = path.join(folderPath, path.basename(file.path));
          if (fs.existsSync(file.path)) {
            fs.renameSync(file.path, newPath);
          }
        }
      }
    }

    // Update files in database
    await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        userId,
      },
      data: { folderId: newFolderId || null },
    });

    // Log the bulk move
    await prisma.log.create({
      data: {
        userId,
        action: 'bulk_move',
        details: `Bulk moved ${files.length} files`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: `Successfully moved ${files.length} files` });
  } catch (error) {
    console.error('Bulk move error:', error);
    res.status(500).json({ error: 'Failed to bulk move files' });
  }
};

export const bulkDownload = async (req: AuthRequest, res: Response) => {
  try {
    const { fileIds } = req.body;
    const userId = req.userId!;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId,
        isDeleted: false,
      },
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found' });
    }

    // Create zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `bulk-download-${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    archive.pipe(res);

    // Add files to archive
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.originalName });
      }
    }

    await archive.finalize();

    // Log the bulk download
    await prisma.log.create({
      data: {
        userId,
        action: 'bulk_download',
        details: `Bulk downloaded ${files.length} files`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
  } catch (error) {
    console.error('Bulk download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to bulk download files' });
    }
  }
};

export const bulkAddTags = async (req: AuthRequest, res: Response) => {
  try {
    const { fileIds, tagIds } = req.body;
    const userId = req.userId!;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'Tag IDs array is required' });
    }

    // Verify files belong to user
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId,
        isDeleted: false,
      },
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found' });
    }

    // Verify tags belong to user
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length === 0) {
      return res.status(404).json({ error: 'No tags found' });
    }

    // Create file-tag associations
    const fileTags = [];
    for (const fileId of fileIds) {
      for (const tagId of tagIds) {
        try {
          const fileTag = await prisma.fileTag.create({
            data: { fileId, tagId },
          });
          fileTags.push(fileTag);
        } catch (error) {
          // Skip duplicates
        }
      }
    }

    res.json({ message: `Successfully added tags to files`, count: fileTags.length });
  } catch (error) {
    console.error('Bulk add tags error:', error);
    res.status(500).json({ error: 'Failed to bulk add tags' });
  }
};

export const bulkRemoveTags = async (req: AuthRequest, res: Response) => {
  try {
    const { fileIds, tagIds } = req.body;
    const userId = req.userId!;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'Tag IDs array is required' });
    }

    // Delete file-tag associations
    const result = await prisma.fileTag.deleteMany({
      where: {
        fileId: { in: fileIds },
        tagId: { in: tagIds },
      },
    });

    res.json({ message: `Successfully removed tags from files`, count: result.count });
  } catch (error) {
    console.error('Bulk remove tags error:', error);
    res.status(500).json({ error: 'Failed to bulk remove tags' });
  }
};
