// src/modules/buyLeads/launchNotify/launchNotifyLead.validation.ts

import { z } from 'zod';

// FormData/query-string booleans arrive as the strings "true"/"false" —
// same `booleanish` fix as priceDropAlertLead.validation.ts.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const launchNotifyLeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against mobile/email.
  search: z.string().trim().min(1).optional(),
  isActive: booleanish.optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['id', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const launchNotifyLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// No status funnel here — just an active/inactive toggle for the
// subscription itself (same reasoning as priceDropAlertLead).
export const updateLaunchNotifyLeadActiveSchema = z.object({
  isActive: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

export const addLaunchNotifyLeadActivitySchema = z.object({
  notes: z.string().trim().min(2, 'Note must be at least 2 characters').max(500),
});

export type LaunchNotifyLeadListQueryParsed = z.infer<typeof launchNotifyLeadListQuerySchema>;
export type UpdateLaunchNotifyLeadActiveParsed = z.infer<typeof updateLaunchNotifyLeadActiveSchema>;
export type AddLaunchNotifyLeadActivityParsed = z.infer<typeof addLaunchNotifyLeadActivitySchema>;
