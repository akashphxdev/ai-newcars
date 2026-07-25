// src/routes/public/v1.ts
//
// Public, unauthenticated API for the website — mirrors routes/v1/v1.ts's
// aggregator pattern, but every module mounted here lives under
// src/modules/public/ and has no auth/permission middleware.
import { Router } from 'express';
import HomeRoutes from './home';
import ArticlesRoutes from './articles';
import BrandsRoutes from './brands';
import CarsRoutes from './cars';
import SiteSettingRoutes from './site-setting';
import CompareRoutes from './compare';

const router = Router();

router.use('/home', HomeRoutes);
router.use('/articles', ArticlesRoutes);
router.use('/brands', BrandsRoutes);
router.use('/cars', CarsRoutes);
router.use('/site-settings', SiteSettingRoutes);
router.use('/compare', CompareRoutes);

export default router;
