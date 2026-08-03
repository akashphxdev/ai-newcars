// src/modules/buyLeads/softLeads/softLead.validation.ts

import { z } from 'zod';

// Same 5-stage funnel as BuyNewCarLead (modules/buyLeads/newCarLeads/buyNewCarLead.validation.ts).
export const SOFT_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'junk'] as const;

// Matches the website's calculator pages — extend here (and in the
// public validation's copy) whenever a new calculator ships.
export const SOFT_LEAD_CALCULATOR_TYPES = [
  'emi',
  'mileage',
  'down_payment',
  'affordability',
  'ev_charging',
  'fuel_comparison',
] as const;

export const softLeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against mobile only — soft leads have no name/email.
  search: z.string().trim().min(1).optional(),
  status: z.enum(SOFT_LEAD_STATUSES).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  calculatorType: z.enum(SOFT_LEAD_CALCULATOR_TYPES).optional(),
  sortBy: z.enum(['id', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const softLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateSoftLeadStatusSchema = z.object({
  status: z.enum(SOFT_LEAD_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const addSoftLeadActivitySchema = z.object({
  notes: z.string().trim().min(2, 'Note must be at least 2 characters').max(500),
});

export type SoftLeadListQueryParsed = z.infer<typeof softLeadListQuerySchema>;
export type UpdateSoftLeadStatusParsed = z.infer<typeof updateSoftLeadStatusSchema>;
export type AddSoftLeadActivityParsed = z.infer<typeof addSoftLeadActivitySchema>;
export type SoftLeadStatus = (typeof SOFT_LEAD_STATUSES)[number];
export type SoftLeadCalculatorType = (typeof SOFT_LEAD_CALCULATOR_TYPES)[number];
