import { Router } from 'express';
import {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  getTrash,
  restoreFile,
  permanentDelete,
  renameFile,
  moveFile,
  previewFile,
  getFileThumbnail,
  upload,
} from '../controllers/fileController';
import { authenticate, attachUser } from '../middleware/auth';

const router = Router();

router.post('/upload', authenticate, attachUser, upload.single('file'), uploadFile);
router.get('/', authenticate, getFiles);
router.get('/download/:fileId', authenticate, downloadFile);
router.get('/preview/:fileId', authenticate, previewFile);
router.get('/thumbnail/:fileId', authenticate, getFileThumbnail);
router.put('/:fileId/rename', authenticate, renameFile);
router.put('/:fileId/move', authenticate, moveFile);
router.delete('/:fileId', authenticate, deleteFile);
router.get('/trash', authenticate, getTrash);
router.post('/trash/:fileId/restore', authenticate, restoreFile);
router.delete('/trash/:fileId/permanent', authenticate, permanentDelete);

export default router;
