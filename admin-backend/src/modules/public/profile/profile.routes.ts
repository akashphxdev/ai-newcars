import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getMyProfile } from './profile.controller';

const router = Router();

router.use(requireAuth(['user']));
router.get('/', asyncHandler(getMyProfile));

export default router;
