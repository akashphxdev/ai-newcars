// src/routes/public/search.ts
import { Router } from 'express';
import SearchRoute from '@/modules/public/search/search.routes';

const router = Router();

router.use('/', SearchRoute);

export default router;
