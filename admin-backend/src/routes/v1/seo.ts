// src/routes/v1/seo.ts
import { Router } from 'express';
import seoMetaRoute from '@/modules/seo/seoMeta/seoMeta.routes';
import seoRedirectRoute from '@/modules/seo/seoRedirect/seoRedirect.routes';

const router = Router();

router.use('/meta', seoMetaRoute);
router.use('/redirects', seoRedirectRoute);

export default router;
