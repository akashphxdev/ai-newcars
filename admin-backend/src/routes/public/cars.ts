// src/routes/public/cars.ts
import { Router } from 'express';
import CarRoute from '@/modules/public/cars/car/car.routes';

const router = Router();

router.use('/', CarRoute);

export default router;
