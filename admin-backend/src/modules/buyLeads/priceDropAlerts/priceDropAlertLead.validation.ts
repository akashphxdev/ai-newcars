// src/modules/buyLeads/priceDropAlerts/priceDropAlertLead.validation.ts

import { z } from 'zod';

export const PRICE_DROP_ALERT_TYPES = ['email', 'sms', 'whatsapp', 'push'] as const;

// FormData/query-string booleans arrive as the strings "true"/"false" —
// plain z.coerce.boolean() incorrectly coerces the STRING "false" to
// `true`. Same fix as brand.validation.ts / offer.validation.ts's `booleanish`.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const priceDropAlertLeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against mobile/email.
  search: z.string().trim().min(1).optional(),
  isActive: booleanish.optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  alertType: z.enum(PRICE_DROP_ALERT_TYPES).optional(),
  sortBy: z.enum(['id', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const priceDropAlertLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// No status funnel here — just an active/inactive toggle for the
// subscription itself.
export const updatePriceDropAlertLeadActiveSchema = z.object({
  isActive: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

export const addPriceDropAlertLeadActivitySchema = z.object({
  notes: z.string().trim().min(2, 'Note must be at least 2 characters').max(500),
});

export type PriceDropAlertLeadListQueryParsed = z.infer<typeof priceDropAlertLeadListQuerySchema>;
export type UpdatePriceDropAlertLeadActiveParsed = z.infer<typeof updatePriceDropAlertLeadActiveSchema>;
export type AddPriceDropAlertLeadActivityParsed = z.infer<typeof addPriceDropAlertLeadActivitySchema>;
