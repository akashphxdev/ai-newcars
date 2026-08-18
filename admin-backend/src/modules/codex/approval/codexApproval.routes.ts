import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  approveCodexProposal,
  getCodexProposalById,
  getCodexProposals,
  getCodexRunEvents,
  getCodexRuns,
  rejectCodexProposal,
} from './codexApproval.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/runs', requirePermission('codex-proposals.view'), asyncHandler(getCodexRuns));
router.get('/runs/:id/events', requirePermission('codex-proposals.view'), asyncHandler(getCodexRunEvents));
router.get('/:entity', requirePermission('codex-proposals.view'), asyncHandler(getCodexProposals));
router.get('/:entity/:id', requirePermission('codex-proposals.view'), asyncHandler(getCodexProposalById));
router.patch('/:entity/:id/reject', requirePermission('codex-proposals.moderate'), asyncHandler(rejectCodexProposal));
router.patch('/:entity/:id/approve', requirePermission('codex-proposals.moderate'), asyncHandler(approveCodexProposal));

export default router;
