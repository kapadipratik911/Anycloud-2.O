import { Router } from 'express';
import {
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getFolders,
  getFolderTree,
} from '../controllers/folderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createFolder);
router.put('/:folderId/rename', authenticate, renameFolder);
router.put('/:folderId/move', authenticate, moveFolder);
router.delete('/:folderId', authenticate, deleteFolder);
router.get('/', authenticate, getFolders);
router.get('/tree', authenticate, getFolderTree);

export default router;
