import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, paginationQuery } from '../validators';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', adminController.stats);
router.get('/users', validate(paginationQuery, 'query'), adminController.users);
router.patch('/users/:id/active', validate(idParam, 'params'), adminController.setActive);
router.patch('/users/:id/role', validate(idParam, 'params'), adminController.setRole);
router.delete('/users/:id', validate(idParam, 'params'), adminController.remove);

export default router;
