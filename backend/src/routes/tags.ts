import { Router } from 'express';
import {
  createTag,
  getUserTags,
  updateTag,
  deleteTag,
  addTagToFile,
  removeTagFromFile,
  getFileTags,
} from '../controllers/tagController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createTag);
router.get('/', authenticate, getUserTags);
router.put('/:tagId', authenticate, updateTag);
router.delete('/:tagId', authenticate, deleteTag);
router.post('/file-tag', authenticate, addTagToFile);
router.delete('/file-tag/:fileId/:tagId', authenticate, removeTagFromFile);
router.get('/file/:fileId', authenticate, getFileTags);

export default router;
