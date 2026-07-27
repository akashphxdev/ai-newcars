// src/routes/public/body-types.ts
import { Router } from 'express';
import BodyTypeRoute from '@/modules/public/bodyTypes/bodyType/bodyType.routes';

const router = Router();

router.use('/', BodyTypeRoute);

export default router;
