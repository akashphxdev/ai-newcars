// src/core/utils/sendResponse.ts

import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  extra?: Record<string, unknown>,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...extra,
  });
}
export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  message = 'Fetched successfully',
) {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination,
  });
}