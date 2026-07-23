// src/routes/index.ts
import { Router } from 'express';
import v1Routes from '@/routes/v1/v1';
import publicV1Routes from '@/routes/public/v1';

const router = Router();
router.use('/v1', v1Routes);
router.use('/public/v1', publicV1Routes);

export default router;