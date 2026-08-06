// src/routes/public/analytics.ts
import { Router } from 'express';
import PageViewRoute from '@/modules/public/analytics/pageView/pageView.public.routes';

const router = Router();

router.use('/page-views', PageViewRoute);

export default router;
