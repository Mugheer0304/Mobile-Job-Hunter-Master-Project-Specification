import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  idParam,
  createPostSchema,
  updatePostSchema,
  commentSchema,
  postQuerySchema,
} from '../validators';

const router = Router();

router.get('/', validate(postQuerySchema, 'query'), postController.list);
router.get('/:id', validate(idParam, 'params'), postController.get);

router.post('/', authenticate, validate(createPostSchema), postController.create);
router.patch('/:id', authenticate, validate(idParam, 'params'), validate(updatePostSchema), postController.update);
router.delete('/:id', authenticate, validate(idParam, 'params'), postController.remove);

router.post('/:id/like', authenticate, validate(idParam, 'params'), postController.like);
router.post('/:id/comments', authenticate, validate(idParam, 'params'), validate(commentSchema), postController.comment);

export default router;
