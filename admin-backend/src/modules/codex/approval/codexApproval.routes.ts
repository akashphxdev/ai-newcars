import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  approveCodexProposal,
  approveCodexVariantPriceChange,
  deleteRejectedCodexProposal,
  getCodexVariantPriceChanges,
  getCodexProposalById,
  getCodexProposals,
  getCodexRunEvents,
  getCodexRuns,
  rejectCodexProposal,
  rejectCodexVariantPriceChange,
  updateCodexProposal,
} from './codexApproval.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/runs', requirePermission('codex-proposals.view'), asyncHandler(getCodexRuns));
router.get('/runs/:id/events', requirePermission('codex-proposals.view'), asyncHandler(getCodexRunEvents));
router.get('/variant-price-changes', requirePermission('codex-proposals.view'), asyncHandler(getCodexVariantPriceChanges));
router.patch('/variant-price-changes/:id/approve', requirePermission('codex-proposals.moderate'), asyncHandler(approveCodexVariantPriceChange));
router.patch('/variant-price-changes/:id/reject', requirePermission('codex-proposals.moderate'), asyncHandler(rejectCodexVariantPriceChange));
router.get('/:entity', requirePermission('codex-proposals.view'), asyncHandler(getCodexProposals));
router.get('/:entity/:id', requirePermission('codex-proposals.view'), asyncHandler(getCodexProposalById));
router.patch('/:entity/:id', requirePermission('codex-proposals.moderate'), asyncHandler(updateCodexProposal));
router.delete('/:entity/:id', requirePermission('codex-proposals.moderate'), asyncHandler(deleteRejectedCodexProposal));
router.patch('/:entity/:id/reject', requirePermission('codex-proposals.moderate'), asyncHandler(rejectCodexProposal));
router.patch('/:entity/:id/approve', requirePermission('codex-proposals.moderate'), asyncHandler(approveCodexProposal));

export default router;
