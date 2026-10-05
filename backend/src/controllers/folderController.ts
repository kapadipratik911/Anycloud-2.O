import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { name, parentId = null } = req.body;
    const userId = req.userId!;

    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if folder with same name exists in same parent
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name,
        userId,
        parentId,
      },
    });

    if (existingFolder) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    // Create folder in database
    const folder = await prisma.folder.create({
      data: {
        name,
        userId,
        parentId,
      },
    });

    // Create physical folder
    const userDir = path.join(config.uploadDir, user.username);
    const folderPath = path.join(userDir, folder.id);
    fs.mkdirSync(folderPath, { recursive: true });

    // Log the folder creation
    await prisma.log.create({
      data: {
        userId,
        action: 'create_folder',
        details: `Created folder ${name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({ message: 'Folder created successfully', folder });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
};

export const renameFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;
    const userId = req.userId!;

    if (!name) {
      return res.status(400).json({ error: 'New name is required' });
    }

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if folder with new name exists in same parent
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name,
        userId,
        parentId: folder.parentId,
        id: { not: folderId },
      },
    });

    if (existingFolder) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    // Update folder in database
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { name },
    });

    // Log the folder rename
    await prisma.log.create({
      data: {
        userId,
        action: 'rename_folder',
        details: `Renamed folder from ${folder.name} to ${name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Folder renamed successfully', folder: updatedFolder });
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ error: 'Failed to rename folder' });
  }
};

export const moveFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { folderId } = req.params;
    const { newParentId } = req.body;
    const userId = req.userId!;

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Prevent moving folder into itself
    if (newParentId === folderId) {
      return res.status(400).json({ error: 'Cannot move folder into itself' });
    }

    // Check if new parent exists and belongs to user
    if (newParentId) {
      const newParent = await prisma.folder.findFirst({
        where: { id: newParentId, userId },
      });

      if (!newParent) {
        return res.status(404).json({ error: 'Target folder not found' });
      }
    }

    // Update folder parent
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { parentId: newParentId },
    });

    // Log the folder move
    await prisma.log.create({
      data: {
        userId,
        action: 'move_folder',
        details: `Moved folder ${folder.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Folder moved successfully', folder: updatedFolder });
  } catch (error) {
    console.error('Move folder error:', error);
    res.status(500).json({ error: 'Failed to move folder' });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId!;

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
      include: {
        files: true,
        children: true,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Recursively delete all files in the folder
    for (const file of folder.files) {
      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delete file from database
      await prisma.file.delete({
        where: { id: file.id },
      });
    }

    // Recursively delete all subfolders
    const deleteSubfolders = async (parentId: string) => {
      const subfolders = await prisma.folder.findMany({
        where: { parentId },
        include: { files: true },
      });

      for (const subfolder of subfolders) {
        // Delete files in subfolder
        for (const file of subfolder.files) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          await prisma.file.delete({
            where: { id: file.id },
          });
        }

        // Recursively delete subfolders
        await deleteSubfolders(subfolder.id);

        // Delete subfolder from database
        await prisma.folder.delete({
          where: { id: subfolder.id },
        });

        // Delete physical subfolder
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (user) {
          const userDir = path.join(config.uploadDir, user.username);
          const subfolderPath = path.join(userDir, subfolder.id);
          if (fs.existsSync(subfolderPath)) {
            fs.rmdirSync(subfolderPath);
          }
        }
      }
    };

    await deleteSubfolders(folderId);

    // Delete folder from database
    await prisma.folder.delete({
      where: { id: folderId },
    });

    // Delete physical folder
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const userDir = path.join(config.uploadDir, user.username);
      const folderPath = path.join(userDir, folderId);
      if (fs.existsSync(folderPath)) {
        fs.rmdirSync(folderPath);
      }
    }

    // Log the folder deletion
    await prisma.log.create({
      data: {
        userId,
        action: 'delete_folder',
        details: `Deleted folder ${folder.name} with ${folder.files.length} files`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};

export const getFolders = async (req: AuthRequest, res: Response) => {
  try {
    const { parentId = null } = req.query;
    const userId = req.userId!;

    const folders = await prisma.folder.findMany({
      where: {
        userId,
        parentId: parentId as string | null,
      },
      include: {
        _count: {
          select: { files: true, children: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ folders });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
};

export const getFolderTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const folders = await prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const buildTree = (parentId: string | null = null): any[] => {
      return folders
        .filter((folder: any) => folder.parentId === parentId)
        .map((folder: any) => ({
          ...folder,
          children: buildTree(folder.id),
        }));
    };

    const tree = buildTree();

    res.json({ tree });
  } catch (error) {
    console.error('Get folder tree error:', error);
    res.status(500).json({ error: 'Failed to get folder tree' });
  }
};
