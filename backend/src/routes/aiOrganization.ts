import { Router } from 'express';
import {
  categorizeFile,
  categorizeAllFiles,
  getSuggestions,
  applySuggestion,
  getCategories,
  getFilesByCategory,
  getFolderSuggestions,
  applyFolderSuggestion,
  getAllFolderSuggestions
} from '../controllers/aiOrganizationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Categorization routes
router.post('/categorize/:fileId', authenticate, categorizeFile);
router.post('/categorize-all', authenticate, categorizeAllFiles);

// Suggestions routes
router.get('/suggestions/:fileId', authenticate, getSuggestions);
router.post('/suggestions/:suggestionId/apply', authenticate, applySuggestion);

// Category routes
router.get('/categories', authenticate, getCategories);
router.get('/categories/:categoryId/files', authenticate, getFilesByCategory);

// Folder suggestion routes
router.get('/folders/:folderId/suggestions', authenticate, getFolderSuggestions);
router.get('/folders/suggestions/all', authenticate, getAllFolderSuggestions);
router.post('/folders/suggestions/apply', authenticate, applyFolderSuggestion);

export default router;