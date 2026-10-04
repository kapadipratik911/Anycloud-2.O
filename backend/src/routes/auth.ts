import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerValidation, loginValidation, validateRequest } from '../middleware/validate';

const router = Router();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/profile', authenticate, getProfile);

export default router;
