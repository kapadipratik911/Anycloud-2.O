import { Router } from 'express';
import {
  bulkDelete,
  bulkMove,
  bulkDownload,
  bulkAddTags,
  bulkRemoveTags,
} from '../controllers/bulkController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/delete', authenticate, bulkDelete);
router.post('/move', authenticate, bulkMove);
router.post('/download', authenticate, bulkDownload);
router.post('/tags/add', authenticate, bulkAddTags);
router.post('/tags/remove', authenticate, bulkRemoveTags);

export default router;
