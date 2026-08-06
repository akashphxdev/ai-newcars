// src/routes/public/v1.ts
//
// Public, unauthenticated API for the website — mirrors routes/v1/v1.ts's
// aggregator pattern, but every module mounted here lives under
// src/modules/public/ and has no auth/permission middleware.
import { Router } from 'express';
import HomeRoutes from './home';
import ArticlesRoutes from './articles';
import BrandsRoutes from './brands';
import BodyTypesRoutes from './body-types';
import CarsRoutes from './cars';
import SiteSettingRoutes from './site-setting';
import CompareRoutes from './compare';
import AuthRoutes from './auth';
import SearchRoutes from './search';
import ReviewsRoutes from './reviews';
import LeadsRoutes from './leads';
import CitiesRoutes from './cities';
import StatesRoutes from './states';
import LendersRoutes from './lenders';
import WishlistRoutes from './wishlist';

const router = Router();

router.use('/home', HomeRoutes);
router.use('/articles', ArticlesRoutes);
router.use('/brands', BrandsRoutes);
router.use('/body-types', BodyTypesRoutes);
router.use('/cars', CarsRoutes);
router.use('/site-settings', SiteSettingRoutes);
router.use('/compare', CompareRoutes);
router.use('/auth', AuthRoutes);
router.use('/search', SearchRoutes);
router.use('/reviews', ReviewsRoutes);
router.use('/leads', LeadsRoutes);
router.use('/cities', CitiesRoutes);
router.use('/states', StatesRoutes);
router.use('/lenders', LendersRoutes);
router.use('/wishlist', WishlistRoutes);

export default router;
