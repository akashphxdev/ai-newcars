// src/modules/admin-log/admin-log.controller.ts

import { Request, Response } from 'express';
import { sendPaginated } from '@/core/utils/sendResponse';
import * as adminLogService from './admin-log.service';
import { adminLogListQuerySchema } from './admin-log.validation';
function serializeLog(log: { id: bigint; [key: string]: unknown }) {
  return { ...log, id: log.id.toString() };
}

// GET /admin-logs
export async function getAdminLogs(req: Request, res: Response) {
  const query = adminLogListQuerySchema.parse(req.query);
  const result = await adminLogService.listAdminLogs(query);

  return sendPaginated(
    res,
    result.items.map(serializeLog),
    result.pagination,
    'Admin logs fetched successfully',
  );
}