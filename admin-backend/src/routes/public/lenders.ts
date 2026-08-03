// src/routes/public/lenders.ts
import { Router } from 'express';
import LenderRoute from '@/modules/public/lenders/lender.public.routes';

const router = Router();

router.use('/', LenderRoute);

export default router;
