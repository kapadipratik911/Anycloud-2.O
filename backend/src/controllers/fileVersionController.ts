import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

export const createFileVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get current version number
    const latestVersion = await prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    // Generate checksum
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');

    // Create version record
    const version = await prisma.fileVersion.create({
      data: {
        fileId,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        checksum,
        version: newVersion,
      },
    });

    // Update main file
    await prisma.file.update({
      where: { id: fileId },
      data: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        checksum,
      },
    });

    // Log the version creation
    await prisma.log.create({
      data: {
        userId,
        action: 'create_version',
        details: `Created version ${newVersion} of ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      message: 'File version created successfully',
      version,
    });
  } catch (error) {
    console.error('Create file version error:', error);
    res.status(500).json({ error: 'Failed to create file version' });
  }
};

export const getFileVersions = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const versions = await prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
    });

    res.json({ versions });
  } catch (error) {
    console.error('Get file versions error:', error);
    res.status(500).json({ error: 'Failed to get file versions' });
  }
};

export const rollbackFileVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, versionId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const version = await prisma.fileVersion.findFirst({
      where: { id: versionId, fileId },
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Create new version of current file before rollback
    const latestVersion = await prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    await prisma.fileVersion.create({
      data: {
        fileId,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        checksum: file.checksum,
        version: newVersion,
      },
    });

    // Rollback to selected version
    await prisma.file.update({
      where: { id: fileId },
      data: {
        filename: version.filename,
        path: version.path,
        size: version.size,
        mimeType: version.mimeType,
        checksum: version.checksum,
      },
    });

    // Log the rollback
    await prisma.log.create({
      data: {
        userId,
        action: 'rollback_version',
        details: `Rolled back ${file.originalName} to version ${version.version}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File rolled back successfully' });
  } catch (error) {
    console.error('Rollback file version error:', error);
    res.status(500).json({ error: 'Failed to rollback file version' });
  }
};

export const deleteFileVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, versionId } = req.params;
    const userId = req.userId!;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const version = await prisma.fileVersion.findFirst({
      where: { id: versionId, fileId },
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Delete physical file
    if (fs.existsSync(version.path)) {
      fs.unlinkSync(version.path);
    }

    // Delete version record
    await prisma.fileVersion.delete({
      where: { id: versionId },
    });

    // Log the deletion
    await prisma.log.create({
      data: {
        userId,
        action: 'delete_version',
        details: `Deleted version ${version.version} of ${file.originalName}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'File version deleted successfully' });
  } catch (error) {
    console.error('Delete file version error:', error);
    res.status(500).json({ error: 'Failed to delete file version' });
  }
};
