// src/routes/v1/v1.ts
import { Router } from 'express';
import healthRoutes from '@/health/health.routes';
import authRoutes from '@/modules/auth/auth.routes';
import adminsRoutes from './admin-users';
import locationsRoutes from './locations'
import NewCarsRoutes from './new-cars'
import ArticlesRoutes from './articles'
import StoriesRoutes from './stories'
import AdsRoutes from './ads'
import AiRoutes from './ai'

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin-users', adminsRoutes);
router.use('/locations', locationsRoutes);
router.use('/new-cars', NewCarsRoutes)
router.use('/articles', ArticlesRoutes)
router.use('/stories', StoriesRoutes)
router.use('/ads' , AdsRoutes)
router.use('/ai', AiRoutes)

export default router;