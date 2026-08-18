import { z } from 'zod';
import { CODEX_ENTITIES } from './codexApproval.types';

export const codexEntityParamSchema = z.object({
  entity: z.enum(CODEX_ENTITIES),
});

export const codexEntityIdParamSchema = codexEntityParamSchema.extend({
  id: z.coerce.number().int().positive(),
});

export const codexRunIdParamSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const codexListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  status: z.enum(['pending', 'rejected']).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  runId: z.coerce.bigint().positive().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const codexRunListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  status: z.string().trim().min(1).max(20).optional(),
  taskType: z.string().trim().min(1).max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CodexListQueryParsed = z.infer<typeof codexListQuerySchema>;
export type CodexRunListQueryParsed = z.infer<typeof codexRunListQuerySchema>;
