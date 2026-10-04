import { Router } from 'express';
import {
  getAllUsers,
  updateUserQuota,
  deleteUser,
  getLogs,
  getVisitorStats,
  trackVisit,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { updateQuotaValidation, validateRequest } from '../middleware/validate';

const router = Router();

router.get('/users', authenticate, requireAdmin, getAllUsers);
router.put('/users/:username/quota', authenticate, requireAdmin, updateQuotaValidation, validateRequest, updateUserQuota);
router.delete('/users/:username', authenticate, requireAdmin, deleteUser);
router.get('/logs', authenticate, requireAdmin, getLogs);
router.get('/visitor-stats', getVisitorStats);
router.post('/track-visit', trackVisit);

export default router;
