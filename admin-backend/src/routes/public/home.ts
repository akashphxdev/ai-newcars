// src/routes/public/home.ts
import { Router } from 'express';
import BannerRoute from '@/modules/public/home/banner/banner.routes';

const router = Router();

router.use('/banners', BannerRoute);

export default router;
