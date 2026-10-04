import { Router } from 'express';
import {
  createStorageRequest,
  getUserStorageRequests,
  getAllStorageRequests,
  approveStorageRequest,
  rejectStorageRequest,
} from '../controllers/storageRequestController';
import { authenticate } from '../middleware/auth';

const router = Router();

// User routes
router.post('/', authenticate, createStorageRequest);
router.get('/my-requests', authenticate, getUserStorageRequests);

// Admin routes
router.get('/all', authenticate, getAllStorageRequests);
router.put('/:requestId/approve', authenticate, approveStorageRequest);
router.put('/:requestId/reject', authenticate, rejectStorageRequest);

export default router;
