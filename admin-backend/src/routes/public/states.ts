// src/routes/public/states.ts
import { Router } from 'express';
import StateRoute from '@/modules/public/states/state.public.routes';

const router = Router();

router.use('/', StateRoute);

export default router;
