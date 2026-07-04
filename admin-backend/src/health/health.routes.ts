import { Router } from 'express';
import { prisma } from '@/prisma/client';
import { asyncHandler } from '@/core/utils/asyncHandler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, message: 'Server is up', timestamp: new Date().toISOString() });
  })
);

// Hits the DB too, so you know Postgres connection is actually working
router.get(
  '/db',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'Database connection is healthy' });
  })
);

export default router;
