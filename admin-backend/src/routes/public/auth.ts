// src/routes/public/auth.ts
import { Router } from 'express';
import AuthRoute from '@/modules/public/auth/auth.routes';

const router = Router();

router.use('/', AuthRoute);

export default router;
