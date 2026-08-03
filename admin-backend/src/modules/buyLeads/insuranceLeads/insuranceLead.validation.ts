// src/modules/buyLeads/insuranceLeads/insuranceLead.validation.ts

import { z } from 'zod';

// Same funnel as BuyNewCarLead — one shared lead lifecycle across lead types.
export const INSURANCE_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'junk'] as const;

// Matches the website's 3-step insurance wizard Step 2 ("Insurance
// Required For").
export const INSURANCE_TYPES = ['new', 'renew', 'expired'] as const;

export const insuranceLeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against name/mobile/registrationNumber.
  search: z.string().trim().min(1).optional(),
  status: z.enum(INSURANCE_LEAD_STATUSES).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  insuranceType: z.enum(INSURANCE_TYPES).optional(),
  sortBy: z.enum(['id', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const insuranceLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateInsuranceLeadStatusSchema = z.object({
  status: z.enum(INSURANCE_LEAD_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const addInsuranceLeadActivitySchema = z.object({
  notes: z.string().trim().min(2, 'Note must be at least 2 characters').max(500),
});

export type InsuranceLeadListQueryParsed = z.infer<typeof insuranceLeadListQuerySchema>;
export type UpdateInsuranceLeadStatusParsed = z.infer<typeof updateInsuranceLeadStatusSchema>;
export type AddInsuranceLeadActivityParsed = z.infer<typeof addInsuranceLeadActivitySchema>;
export type InsuranceLeadStatus = (typeof INSURANCE_LEAD_STATUSES)[number];
export type InsuranceType = (typeof INSURANCE_TYPES)[number];
