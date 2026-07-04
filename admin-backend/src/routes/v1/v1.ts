// src/routes/v1/v1.ts
import { Router } from 'express';
import healthRoutes from '@/health/health.routes';
import authRoutes from '@/modules/auth/auth.routes';
import adminsRoutes from './admin-users';
import locationsRoutes from './locations'
import NewCarsRoutes from './new-cars'

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin-users', adminsRoutes);
router.use('/locations', locationsRoutes);
router.use('/new-cars', NewCarsRoutes)

export default router;