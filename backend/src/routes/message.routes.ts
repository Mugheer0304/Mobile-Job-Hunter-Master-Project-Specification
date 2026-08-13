import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  conversationIdParam,
  createConversationSchema,
  sendMessageSchema,
  messageQuerySchema,
} from '../validators';

const router = Router();

router.get('/conversations', authenticate, messageController.conversations);
router.post('/conversations', authenticate, validate(createConversationSchema), messageController.createConversation);
router.post('/messages', authenticate, validate(sendMessageSchema), messageController.send);
router.get(
  '/conversations/:conversationId/messages',
  authenticate,
  validate(conversationIdParam, 'params'),
  validate(messageQuerySchema, 'query'),
  messageController.messages,
);

export default router;
