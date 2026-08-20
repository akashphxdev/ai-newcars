// src/modules/sellLeads/scrapLeads/scrapLead.validation.ts

import { z } from 'zod';

// The shared lead funnel, plus the two states that only exist once a
// vehicle is physically involved: a quote has been given, and the car
// has been collected and scrapped.
export const SCRAP_LEAD_STATUSES = [
  'new',
  'contacted',
  'quoted',
  'pickup_scheduled',
  'scrapped',
  'converted',
  'junk',
] as const;

// Matches the website's scrap form.
export const SCRAP_VEHICLE_CONDITIONS = ['running', 'not_running', 'accidental'] as const;

export const scrapLeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against name/mobile/registrationNumber.
  search: z.string().trim().min(1).optional(),
  status: z.enum(SCRAP_LEAD_STATUSES).optional(),
  cityId: z.coerce.number().int().positive().optional(),
  vehicleCondition: z.enum(SCRAP_VEHICLE_CONDITIONS).optional(),
  sortBy: z.enum(['id', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const scrapLeadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateScrapLeadStatusSchema = z.object({
  status: z.enum(SCRAP_LEAD_STATUSES),
  note: z.string().trim().max(500).optional(),
});

// The yard's offer, recorded against the lead once it is made.
export const updateScrapLeadQuoteSchema = z.object({
  quotedPrice: z.coerce.number().min(0, 'Quote cannot be negative').max(99_999_999),
  notes: z.string().trim().max(500).optional(),
});

export const addScrapLeadActivitySchema = z.object({
  notes: z.string().trim().min(2, 'Note must be at least 2 characters').max(500),
});

export type ScrapLeadListQueryParsed = z.infer<typeof scrapLeadListQuerySchema>;
export type UpdateScrapLeadStatusParsed = z.infer<typeof updateScrapLeadStatusSchema>;
export type UpdateScrapLeadQuoteParsed = z.infer<typeof updateScrapLeadQuoteSchema>;
export type AddScrapLeadActivityParsed = z.infer<typeof addScrapLeadActivitySchema>;
export type ScrapLeadStatus = (typeof SCRAP_LEAD_STATUSES)[number];
export type ScrapVehicleCondition = (typeof SCRAP_VEHICLE_CONDITIONS)[number];
