// src/routes/public/brands.ts
import { Router } from 'express';
import BrandRoute from '@/modules/public/brands/brand/brand.routes';

const router = Router();

router.use('/', BrandRoute);

export default router;
