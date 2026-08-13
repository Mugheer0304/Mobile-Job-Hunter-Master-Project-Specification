import { Router } from 'express';
import * as connectionController from '../controllers/connection.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, connectionRequestSchema, connectionRespondSchema, connectionQuerySchema } from '../validators';

const router = Router();

router.post('/', authenticate, validate(connectionRequestSchema), connectionController.send);
router.get('/', authenticate, validate(connectionQuerySchema, 'query'), connectionController.list);
router.get('/pending', authenticate, connectionController.pending);
router.patch(
  '/:id',
  authenticate,
  validate(idParam, 'params'),
  validate(connectionRespondSchema),
  connectionController.respond,
);

export default router;
