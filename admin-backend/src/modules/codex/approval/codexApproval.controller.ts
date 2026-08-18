import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { getClientIp } from '@/core/utils/getClientIp';
import { sendPaginated, sendSuccess } from '@/core/utils/sendResponse';
import * as codexApprovalService from './codexApproval.service';
import {
  codexEntityIdParamSchema,
  codexEntityParamSchema,
  codexListQuerySchema,
  codexRunIdParamSchema,
  codexRunListQuerySchema,
} from './codexApproval.validation';

export async function getCodexRuns(req: Request, res: Response) {
  const query = codexRunListQuerySchema.parse(req.query);
  const result = await codexApprovalService.listRuns(query);
  return sendPaginated(res, result.items, result.pagination, 'Codex runs fetched successfully');
}

export async function getCodexRunEvents(req: Request, res: Response) {
  const { id } = codexRunIdParamSchema.parse(req.params);
  const events = await codexApprovalService.listRunEvents(id);
  return sendSuccess(res, events, 'Codex run events fetched successfully');
}

export async function getCodexProposals(req: Request, res: Response) {
  const { entity } = codexEntityParamSchema.parse(req.params);
  const query = codexListQuerySchema.parse(req.query);
  const result = await codexApprovalService.listProposals(entity, query);
  return sendPaginated(res, result.items, result.pagination, 'Codex proposals fetched successfully');
}

export async function getCodexProposalById(req: Request, res: Response) {
  const { entity, id } = codexEntityIdParamSchema.parse(req.params);
  const proposal = await codexApprovalService.getProposalById(entity, id);
  return sendSuccess(res, proposal, 'Codex proposal fetched successfully');
}

export async function rejectCodexProposal(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const { entity, id } = codexEntityIdParamSchema.parse(req.params);
  const proposal = await codexApprovalService.rejectProposal(entity, id, req.auth.id, getClientIp(req));
  return sendSuccess(res, proposal, 'Codex proposal rejected successfully');
}

export async function approveCodexProposal(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const { entity, id } = codexEntityIdParamSchema.parse(req.params);
  const result = await codexApprovalService.approveProposal(entity, id, req.auth.id, getClientIp(req));
  return sendSuccess(res, result, 'Codex proposal approved successfully');
}
