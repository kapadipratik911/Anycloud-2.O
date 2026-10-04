import { Router } from 'express';
import {
  createShare,
  getSharedFile,
  getUserShares,
  deleteShare,
} from '../controllers/shareController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createShare);
router.get('/user', authenticate, getUserShares);
router.delete('/:shareId', authenticate, deleteShare);
router.get('/share/:token', getSharedFile);

export default router;
