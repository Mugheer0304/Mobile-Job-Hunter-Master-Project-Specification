import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { notificationQuerySchema, markReadSchema } from '../validators';

const router = Router();

router.get('/', authenticate, validate(notificationQuerySchema, 'query'), notificationController.list);
router.post('/read', authenticate, validate(markReadSchema), notificationController.markRead);

export default router;
