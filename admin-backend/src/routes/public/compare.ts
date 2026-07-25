// src/routes/public/compare.ts
import { Router } from 'express';
import CompareRoute from '@/modules/public/compare/compare.routes';

const router = Router();

router.use('/', CompareRoute);

export default router;
