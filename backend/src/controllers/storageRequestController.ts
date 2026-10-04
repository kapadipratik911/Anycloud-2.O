import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createStorageRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { requestedMb, reason } = req.body;

    if (!requestedMb || requestedMb <= 0) {
      return res.status(400).json({ error: 'Invalid requested storage amount' });
    }

    // Check if user has a pending request
    const existingPendingRequest = await prisma.storageRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    });

    if (existingPendingRequest) {
      return res.status(400).json({ error: 'You already have a pending storage request' });
    }

    // Get current user quota
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create storage request
    const request = await prisma.storageRequest.create({
      data: {
        userId,
        requestedMb,
        reason,
      },
    });

    // Log the request
    await prisma.log.create({
      data: {
        userId,
        action: 'storage_request',
        details: `Requested ${requestedMb} MB additional storage`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      message: 'Storage request submitted successfully',
      request,
    });
  } catch (error) {
    console.error('Create storage request error:', error);
    res.status(500).json({ error: 'Failed to create storage request' });
  }
};

export const getUserStorageRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const requests = await prisma.storageRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get user storage requests error:', error);
    res.status(500).json({ error: 'Failed to fetch storage requests' });
  }
};

export const getAllStorageRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.storageRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            quotaMb: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get all storage requests error:', error);
    res.status(500).json({ error: 'Failed to fetch storage requests' });
  }
};

export const approveStorageRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const adminId = req.userId!;

    const request = await prisma.storageRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Storage request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update user quota
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        quotaMb: request.user.quotaMb + request.requestedMb,
      },
    });

    // Update request status
    const updatedRequest = await prisma.storageRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Log the approval
    await prisma.log.create({
      data: {
        userId: adminId,
        action: 'approve_storage_request',
        details: `Approved ${request.requestedMb} MB storage for user ${request.user.username}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      message: 'Storage request approved successfully',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Approve storage request error:', error);
    res.status(500).json({ error: 'Failed to approve storage request' });
  }
};

export const rejectStorageRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const adminId = req.userId!;

    const request = await prisma.storageRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Storage request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update request status
    const updatedRequest = await prisma.storageRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Log the rejection
    await prisma.log.create({
      data: {
        userId: adminId,
        action: 'reject_storage_request',
        details: `Rejected ${request.requestedMb} MB storage request from user ${request.user.username}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      message: 'Storage request rejected successfully',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Reject storage request error:', error);
    res.status(500).json({ error: 'Failed to reject storage request' });
  }
};
