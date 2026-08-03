// src/modules/lenders/lender/lender.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import { getClientIp } from '@/core/utils/getClientIp';
import * as lenderService from './lender.service';
import {
  lenderListQuerySchema,
  lenderOptionsQuerySchema,
  lenderIdParamSchema,
  createLenderSchema,
  updateLenderSchema,
  updateLenderStatusSchema,
} from './lender.validation';

// GET /lenders
export async function getLenders(req: Request, res: Response) {
  const query = lenderListQuerySchema.parse(req.query);
  const result = await lenderService.listLenders(query);
  return sendPaginated(res, result.items, result.pagination, 'Lenders fetched successfully');
}

// GET /lenders/options — lightweight, unpaginated {id, name} list for
// the Loan Lead form's dropdown.
export async function getLenderOptions(req: Request, res: Response) {
  const query = lenderOptionsQuerySchema.parse(req.query);
  const options = await lenderService.listLenderOptions(query);
  return sendSuccess(res, options, 'Lender options fetched successfully');
}

// GET /lenders/:id
export async function getLenderById(req: Request, res: Response) {
  const { id } = lenderIdParamSchema.parse(req.params);
  const lender = await lenderService.getLenderById(id);
  return sendSuccess(res, lender, 'Lender fetched successfully');
}

// POST /lenders — logo is optional here (unlike Brand's mandatory logo).
export async function createLender(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  try {
    const input = createLenderSchema.parse(req.body);
    const lender = await lenderService.createLender(input, req.auth.id, req.file?.filename, getClientIp(req));
    return sendSuccess(res, lender, 'Lender created successfully', 201);
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('lenders', req.file.filename));
    }
    throw err;
  }
}

// PATCH /lenders/:id
export async function updateLender(req: Request, res: Response) {
  const { id } = lenderIdParamSchema.parse(req.params);
  const input = updateLenderSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lender = await lenderService.updateLender(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lender, 'Lender updated successfully');
}

// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
export async function updateLenderStatus(req: Request, res: Response) {
  const { id } = lenderIdParamSchema.parse(req.params);
  const { isActive } = updateLenderStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lender = await lenderService.updateLenderStatus(id, isActive, req.auth.id, getClientIp(req));
  return sendSuccess(res, lender, 'Lender status updated successfully');
}

export async function uploadLenderLogo(req: Request, res: Response) {
  const { id } = lenderIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "logo")');
  }

  const lender = await lenderService.uploadLenderLogo(id, req.file.filename, req.auth.id, getClientIp(req));
  return sendSuccess(res, lender, 'Lender logo updated successfully');
}

// DELETE /lenders/:id
export async function deleteLender(req: Request, res: Response) {
  const { id } = lenderIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await lenderService.deleteLender(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
