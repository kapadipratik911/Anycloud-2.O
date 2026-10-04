import { Router } from 'express';
import {
  createComment,
  getFileComments,
  updateComment,
  deleteComment,
} from '../controllers/fileCommentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:fileId/comments', authenticate, createComment);
router.get('/:fileId/comments', authenticate, getFileComments);
router.put('/comments/:commentId', authenticate, updateComment);
router.delete('/comments/:commentId', authenticate, deleteComment);

export default router;
