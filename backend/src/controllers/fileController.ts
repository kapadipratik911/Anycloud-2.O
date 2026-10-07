import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const username = (req as AuthRequest).username;
    const userDir = path.join(config.uploadDir, username!);
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (config.allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File format not supported. Supported formats: ${config.allowedExtensions.join(', ')}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize },
});

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.userId!;
    const { folderId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check storage quota
    const userDir = path.join(config.uploadDir, user.username);
    const storageUsed = calculateFolderSize(userDir);
    const fileSizeMB = req.file.size / (1024 * 1024);
    const totalStorageMB = storageUsed + fileSizeMB;

    if (totalStorageMB > user.quotaMb) {
      fs.unlinkSync(req.file.path);
      return res.status(413).json({ 
        error: 'Storage limit exceeded',
        available: user.quotaMb - storageUsed,
        required: fileSizeMB,
      });
    }

    // Generate checksum
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');

    // Check for duplicate files
    const existingFile = await prisma.file.findFirst({
      where: {
        userId,
        checksum,
        isDeleted: false,
      },
    });

    if (existingFile) {
      fs.unlinkSync(req.file.path);
      return res.status(409).json({ 
        error: 'Duplicate file detected',
        existingFile: {
          id: existingFile.id,
          filename: existingFile.originalName,
        },
      });
    }

    // Determine upload path (folder or root)
    let uploadPath = req.file.path;
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId },
      });
      if (folder) {
        const folderPath = path.join(userDir, folderId);
        fs.mkdirSync(folderPath, { recursive: true });
        const newPath = path.join(folderPath, path.basename(req.file.path));
        fs.renameSync(req.file.path, newPath);
        uploadPath = newPath;
      }
    }

    const file = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: uploadPath,
        size: req.file.size,
        mimeType: req.file.mimetype,
        userId,
        folderId,
        checksum,
      },
    });

    // Add to recent files
    await prisma.recentFile.upsert({
      where: {
        fileId_userId: {
          fileId: file.id,
          userId,
        },
      },
      update: {
        createdAt: new Date(),
      },
      create: {
        fileId: file.id,
        userId,
      },
    });

    // Log the upload
    await prisma.log.create({
      data: {
        userId,
        action: 'upload',
        details: `Uploaded ${req.file.originalname}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        filename: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        checksum: file.checksum,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

export const getFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { folderId } = req.query;

    // Handle folderId being "null" string vs actual null
    const parsedFolderId = folderId === 'null' || folderId === '' ? null : folderId as string | null | undefined;

    const files = await prisma.file.findMany({
      where: {
        userId,
        isDeleted: false,
        folderId: parsedFolderId,
      },
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
      orderBy: { createdAt: 'desc' },
    });

    const filesWithMetadata = files.map((file: any) => ({
      ...file,
      isFavorite: file.favorites.length > 0,
      tags: file.tags.map((ft: any) => ft.tag),
    }));

    res.json({ files: filesWithMetadata });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File does not exist on disk' });
    }

    res.download(file.path, file.originalName);

    // Log the download
    await prisma.log.create({
      data: {
        userId,
        action: 'download',
        details: `Downloaded ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Soft delete
    await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    // Log the deletion
    await prisma.log.create({
      data: {
        userId,
        action: 'delete',
        details: `Moved ${file.originalName} to trash`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File moved to trash' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
};

export const getTrash = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const files = await prisma.file.findMany({
      where: { userId, isDeleted: true },
      orderBy: { deletedAt: 'desc' },
    });

    res.json({ files });
  } catch (error) {
    console.error('Get trash error:', error);
    res.status(500).json({ error: 'Failed to fetch trash' });
  }
};

export const restoreFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: true },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found in trash' });
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: false, deletedAt: null },
    });

    // Log the restore
    await prisma.log.create({
      data: {
        userId,
        action: 'restore',
        details: `Restored ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File restored successfully' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Restore failed' });
  }
};

export const permanentDelete = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: true },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found in trash' });
    }

    // Delete from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    // Log the permanent delete
    await prisma.log.create({
      data: {
        userId,
        action: 'permanent_delete',
        details: `Permanently deleted ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ error: 'Permanent delete failed' });
  }
};

export const renameFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;
    const userId = req.userId!;

    if (!newName) {
      return res.status(400).json({ error: 'New name is required' });
    }

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { originalName: newName },
    });

    // Log the rename
    await prisma.log.create({
      data: {
        userId,
        action: 'rename_file',
        details: `Renamed file from ${file.originalName} to ${newName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File renamed successfully', file: updatedFile });
  } catch (error) {
    console.error('Rename file error:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
};

export const moveFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const { newFolderId } = req.body;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if new folder exists and belongs to user
    if (newFolderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: newFolderId, userId },
      });

      if (!folder) {
        return res.status(404).json({ error: 'Target folder not found' });
      }

      // Move file physically
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const userDir = path.join(config.uploadDir, user.username);
        const folderPath = path.join(userDir, newFolderId);
        const newPath = path.join(folderPath, path.basename(file.path));
        
        fs.mkdirSync(folderPath, { recursive: true });
        fs.renameSync(file.path, newPath);

        await prisma.file.update({
          where: { id: fileId },
          data: { path: newPath, folderId: newFolderId },
        });
      }
    } else {
      // Move to root
      await prisma.file.update({
        where: { id: fileId },
        data: { folderId: null },
      });
    }

    // Log the move
    await prisma.log.create({
      data: {
        userId,
        action: 'move_file',
        details: `Moved file ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File moved successfully' });
  } catch (error) {
    console.error('Move file error:', error);
    res.status(500).json({ error: 'Failed to move file' });
  }
};

export const previewFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File does not exist on disk' });
    }

    // Set appropriate content type for preview
    const contentType = file.mimeType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Stream the file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });

    // Log the preview
    await prisma.log.create({
      data: {
        userId,
        action: 'preview',
        details: `Previewed ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
  } catch (error) {
    console.error('Preview file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to preview file' });
    }
  }
};

export const getFileThumbnail = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File does not exist on disk' });
    }

    // Check if file is an image
    if (!file.mimeType || !file.mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'File is not an image' });
    }

    // For now, just serve the original image
    // In production, you'd want to generate actual thumbnails
    res.setHeader('Content-Type', file.mimeType);
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });
  } catch (error) {
    console.error('Get file thumbnail error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to get file thumbnail' });
    }
  }
};

function calculateFolderSize(folderPath: string): number {
  let totalSize = 0;
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        totalSize += calculateFolderSize(filePath);
      } else {
        totalSize += stats.size / (1024 * 1024);
      }
    }
  }
  return totalSize;
}
