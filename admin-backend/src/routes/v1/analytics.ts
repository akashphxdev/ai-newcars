// src/routes/v1/analytics.ts
import { Router } from 'express';
import searchLogRoute from '@/modules/analytics/searchLog/searchLog.routes';

const router = Router();

router.use('/search-logs', searchLogRoute);

export default router;
