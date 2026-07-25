// src/routes/public/site-setting.ts
import { Router } from 'express';
import SiteSettingRoute from '@/modules/public/siteSetting/siteSetting.routes';

const router = Router();

router.use('/', SiteSettingRoute);

export default router;
