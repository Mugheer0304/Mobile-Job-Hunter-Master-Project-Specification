import { Router } from 'express';
import * as jobController from '../controllers/job.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, createJobSchema, updateJobSchema, jobQuerySchema } from '../validators';

const router = Router();

router.get('/', validate(jobQuerySchema, 'query'), jobController.list);
router.get('/:id', validate(idParam, 'params'), jobController.get);

router.post('/', authenticate, validate(createJobSchema), jobController.create);
router.patch('/:id', authenticate, validate(idParam, 'params'), validate(updateJobSchema), jobController.update);
router.delete('/:id', authenticate, validate(idParam, 'params'), jobController.remove);

export default router;
