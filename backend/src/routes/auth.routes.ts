import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from '../validators';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);

router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
