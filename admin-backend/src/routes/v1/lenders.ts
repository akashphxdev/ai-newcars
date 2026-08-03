// src/routes/v1/lenders.ts
import { Router } from 'express';
import LenderRoute from '@/modules/lenders/lender/lender.routes';

const router = Router();

router.use('/', LenderRoute);

export default router;
