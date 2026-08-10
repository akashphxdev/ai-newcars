// src/routes/public/seo.ts
import { Router } from 'express';
import SeoMetaRoute from '@/modules/public/seo/seoMeta/seoMeta.routes';
import SeoRedirectRoute from '@/modules/public/seo/seoRedirect/seoRedirect.routes';

const router = Router();

router.use('/meta', SeoMetaRoute);
router.use('/redirects', SeoRedirectRoute);

export default router;
