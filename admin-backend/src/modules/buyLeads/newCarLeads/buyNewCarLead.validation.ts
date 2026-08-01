// src/modules/buyLeads/newCarLeads/buyNewCarLead.validation.ts

import { z } from 'zod';

// Shared lead funnel — same 5 stages will be reused by InsuranceLead.
export const BUY_NEW_CAR_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'junk'] as const;

// Matches the website's car-detail-page CTAs ("Enquire Now" / "Check
// Offers") — only these two exist today, extend when more CTAs ship.
export const BUY_NEW_CAR_LEAD_INTEREST_TYPES = ['enquiry', 'offer_check'] as const;

export const buyNewCarLeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against name/mobile/email.
  search: z.string().trim().min(1).optional(),
  status: z.enum(BUY_NEW_CAR_LEAD_STATUSES).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  interestType: z.enum(BUY_NEW_CAR_LEAD_INTEREST_TYPES).optional(),
  sortBy: z.enum(['id', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const buyNewCarLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateBuyNewCarLeadStatusSchema = z.object({
  status: z.enum(BUY_NEW_CAR_LEAD_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const addBuyNewCarLeadActivitySchema = z.object({
  notes: z.string().trim().min(2, 'Note must be at least 2 characters').max(500),
});

export type BuyNewCarLeadListQueryParsed = z.infer<typeof buyNewCarLeadListQuerySchema>;
export type UpdateBuyNewCarLeadStatusParsed = z.infer<typeof updateBuyNewCarLeadStatusSchema>;
export type AddBuyNewCarLeadActivityParsed = z.infer<typeof addBuyNewCarLeadActivitySchema>;
export type BuyNewCarLeadStatus = (typeof BUY_NEW_CAR_LEAD_STATUSES)[number];
