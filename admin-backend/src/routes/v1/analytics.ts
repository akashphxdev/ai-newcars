// src/routes/v1/analytics.ts
import { Router } from 'express';
import searchLogRoute from '@/modules/analytics/searchLog/searchLog.routes';
import pageViewRoute from '@/modules/analytics/pageView/pageView.routes';

const router = Router();

router.use('/search-logs', searchLogRoute);
router.use('/page-views', pageViewRoute);

export default router;
