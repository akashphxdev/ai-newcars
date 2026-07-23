// src/routes/v1/setting.ts
import { Router } from 'express';
import SiteSettingRoute from '@/modules/siteSetting/siteSetting.routes';

const router = Router();

router.use('/', SiteSettingRoute);

export default router;