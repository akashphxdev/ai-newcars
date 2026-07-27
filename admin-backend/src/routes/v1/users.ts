// src/routes/v1/users.ts
import { Router } from 'express';
import userRoutes from '@/modules/users/user/user.routes';

const router = Router();

router.use('/', userRoutes);

export default router;
