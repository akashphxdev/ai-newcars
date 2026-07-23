// src/routes/public/home.ts
import { Router } from 'express';
import BannerRoute from '@/modules/public/home/banner/banner.routes';
import BrandRoute from '@/modules/public/home/brand/brand.routes';
import CarRoute from '@/modules/public/home/car/car.routes';
import CityRoute from '@/modules/public/home/city/city.routes';
import ArticleRoute from '@/modules/public/home/article/article.routes';
import TestimonialRoute from '@/modules/public/home/testimonial/testimonial.routes';

const router = Router();

router.use('/banners', BannerRoute);
router.use('/brands', BrandRoute);
router.use('/cars', CarRoute);
router.use('/cities', CityRoute);
router.use('/articles', ArticleRoute);
router.use('/testimonials', TestimonialRoute);

export default router;
