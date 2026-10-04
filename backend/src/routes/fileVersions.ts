import { Router } from 'express';
import {
  createFileVersion,
  getFileVersions,
  rollbackFileVersion,
  deleteFileVersion,
} from '../controllers/fileVersionController';
import { authenticate } from '../middleware/auth';
import { upload } from '../controllers/fileController';

const router = Router();

router.post('/:fileId/versions', authenticate, upload.single('file'), createFileVersion);
router.get('/:fileId/versions', authenticate, getFileVersions);
router.post('/:fileId/versions/:versionId/rollback', authenticate, rollbackFileVersion);
router.delete('/:fileId/versions/:versionId', authenticate, deleteFileVersion);

export default router;
