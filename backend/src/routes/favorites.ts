import { Router } from 'express';
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  getRecentFiles,
} from '../controllers/favoriteController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/:fileId', authenticate, addFavorite);
router.delete('/:fileId', authenticate, removeFavorite);
router.get('/', authenticate, getUserFavorites);
router.get('/recent', authenticate, getRecentFiles);

export default router;
