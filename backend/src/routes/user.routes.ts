import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  idParam,
  updateMeSchema,
  updateProfileSchema,
  experienceSchema,
  educationSchema,
  skillSchema,
} from '../validators';

const router = Router();

router.get('/:id', authenticate, validate(idParam, 'params'), userController.getProfile);
router.patch('/me', authenticate, validate(updateMeSchema), userController.updateMe);
router.put('/me/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);

router.post('/me/experience', authenticate, validate(experienceSchema), userController.addExperience);
router.delete('/me/experience/:id', authenticate, validate(idParam, 'params'), userController.removeExperience);

router.post('/me/education', authenticate, validate(educationSchema), userController.addEducation);
router.delete('/me/education/:id', authenticate, validate(idParam, 'params'), userController.removeEducation);

router.post('/me/skills', authenticate, validate(skillSchema), userController.addSkill);
router.delete('/me/skills/:name', authenticate, userController.removeSkill);

export default router;
