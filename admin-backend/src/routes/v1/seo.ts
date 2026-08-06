// src/routes/v1/seo.ts
import { Router } from 'express';
import seoMetaRoute from '@/modules/seo/seoMeta/seoMeta.routes';

const router = Router();

router.use('/meta', seoMetaRoute);

export default router;
