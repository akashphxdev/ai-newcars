// src/routes/public/cities.ts
import { Router } from 'express';
import CityRoute from '@/modules/public/cities/city.public.routes';

const router = Router();

router.use('/', CityRoute);

export default router;
