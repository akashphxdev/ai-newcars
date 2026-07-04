import { Request } from 'express';

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function getPagination(req: Request, defaultLimit = 20, maxLimit = 100): PaginationParams {
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  let limit = parseInt(String(req.query.limit ?? defaultLimit), 10) || defaultLimit;
  limit = Math.min(limit, maxLimit);
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
