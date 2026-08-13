import { Router } from 'express';
import * as applicationController from '../controllers/application.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  idParam,
  jobIdParam,
  createApplicationSchema,
  updateApplicationStatusSchema,
  applicationQuerySchema,
} from '../validators';

const router = Router();

router.post('/', authenticate, validate(createApplicationSchema), applicationController.apply);
router.get('/mine', authenticate, validate(applicationQuerySchema, 'query'), applicationController.mine);
router.get('/job/:jobId', authenticate, validate(jobIdParam, 'params'), applicationController.listForJob);
router.patch(
  '/:id',
  authenticate,
  validate(idParam, 'params'),
  validate(updateApplicationStatusSchema),
  applicationController.updateStatus,
);

export default router;
