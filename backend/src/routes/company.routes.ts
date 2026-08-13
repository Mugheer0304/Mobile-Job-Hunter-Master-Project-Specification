import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, createCompanySchema, updateCompanySchema, companyQuerySchema } from '../validators';

const router = Router();

router.get('/', validate(companyQuerySchema, 'query'), companyController.list);
router.get('/:id', validate(idParam, 'params'), companyController.get);

router.post('/', authenticate, validate(createCompanySchema), companyController.create);
router.patch('/:id', authenticate, validate(idParam, 'params'), validate(updateCompanySchema), companyController.update);
router.delete('/:id', authenticate, validate(idParam, 'params'), companyController.remove);

export default router;
