import { Router } from 'express';
import ProfileRoute from '@/modules/public/profile/profile.routes';

const router = Router();

router.use('/', ProfileRoute);

export default router;
