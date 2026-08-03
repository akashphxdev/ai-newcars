// src/modules/buyLeads/loanLeads/loanLead.validation.ts

import { z } from 'zod';

// Same funnel as BuyNewCarLead/InsuranceLead — one shared lead lifecycle across lead types.
export const LOAN_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'junk'] as const;

export const loanLeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against name/mobile.
  search: z.string().trim().min(1).optional(),
  status: z.enum(LOAN_LEAD_STATUSES).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  lenderId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['id', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const loanLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateLoanLeadStatusSchema = z.object({
  status: z.enum(LOAN_LEAD_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const addLoanLeadActivitySchema = z.object({
  notes: z.string().trim().min(2, 'Note must be at least 2 characters').max(500),
});

export type LoanLeadListQueryParsed = z.infer<typeof loanLeadListQuerySchema>;
export type UpdateLoanLeadStatusParsed = z.infer<typeof updateLoanLeadStatusSchema>;
export type AddLoanLeadActivityParsed = z.infer<typeof addLoanLeadActivitySchema>;
export type LoanLeadStatus = (typeof LOAN_LEAD_STATUSES)[number];
