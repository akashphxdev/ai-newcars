// src/routes/v1/ai.ts
import { Router } from 'express';
import settingRoute from '@/modules/ai/setting/setting.routes';
import automationRuleRoute from '@/modules/ai/automationRule/automationRule.routes';
import aiFaqRoute from '@/modules/ai/aiFaq/aiFaq.routes';
import aiLogRoute from '@/modules/ai/log/aiLog.routes';
import imagePoolRoute from '@/modules/ai/imagePool/imagePool.routes';
import aiArticleRoute from '@/modules/ai/aiArticle/aiArticle.routes';
import aiStoryItemRoute from '@/modules/ai/aiStoryItem/aiStoryItem.routes';
import dashboardRoute from '@/modules/ai/dashboard/dashboard.routes';

const router = Router();

router.use('/settings', settingRoute);
router.use('/automation-rules', automationRuleRoute);
router.use('/faqs', aiFaqRoute);
router.use('/logs', aiLogRoute);
router.use('/image-pool', imagePoolRoute);
router.use('/articles', aiArticleRoute);
router.use('/story-items', aiStoryItemRoute);
router.use('/dashboard', dashboardRoute);

export default router;