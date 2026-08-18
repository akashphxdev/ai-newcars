import { Router } from 'express';
import codexApprovalRoutes from '@/modules/codex/approval/codexApproval.routes';

const router = Router();

router.use('/', codexApprovalRoutes);

export default router;
