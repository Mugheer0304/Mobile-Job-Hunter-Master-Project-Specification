import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import jobRoutes from './job.routes';
import applicationRoutes from './application.routes';
import connectionRoutes from './connection.routes';
import postRoutes from './post.routes';
import companyRoutes from './company.routes';
import messageRoutes from './message.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/connections', connectionRoutes);
router.use('/posts', postRoutes);
router.use('/companies', companyRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
