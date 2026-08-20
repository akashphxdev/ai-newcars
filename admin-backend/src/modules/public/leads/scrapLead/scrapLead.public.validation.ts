// src/modules/public/leads/scrapLead/scrapLead.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema } from '../leadOtp.validation';

// Matches admin's SCRAP_VEHICLE_CONDITIONS
// (modules/sellLeads/scrapLeads/scrapLead.validation.ts).
export const PUBLIC_VEHICLE_CONDITIONS = ['running', 'not_running', 'accidental'] as const;

const currentYear = new Date().getFullYear();

// Under the national scrappage policy a private vehicle becomes eligible
// at 15 years, so anything newer than that is almost certainly a typo or
// someone on the wrong form. The bound is generous rather than exact —
// commercial vehicles differ, and a wrong rejection costs a real lead.
const OLDEST_PLAUSIBLE_YEAR = 1960;

export const createScrapLeadSchema = z.object({
  name: z.string().trim().max(100).optional(),
  mobile: leadMobileSchema,
  email: z.string().trim().toLowerCase().email('Invalid email address').max(150).optional(),

  // Catalogue ids when we recognise the car, free text when we do not.
  // A 15-year-old car frequently is not in the catalogue at all, so the
  // text fields are the ones that carry most real submissions.
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  brandName: z.string().trim().max(100).optional(),
  modelName: z.string().trim().max(100).optional(),

  registrationNumber: z.string().trim().max(20).optional(),
  registrationYear: z.coerce.number().int().min(OLDEST_PLAUSIBLE_YEAR).max(currentYear).optional(),
  registrationStateId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  fuelType: z.string().trim().max(20).optional(),

  vehicleCondition: z.enum(PUBLIC_VEHICLE_CONDITIONS).optional(),
  hasOriginalRc: z.coerce.boolean().optional(),
  isHypothecated: z.coerce.boolean().optional(),
  hasPendingChallan: z.coerce.boolean().optional(),
  wantsCertificateOfDeposit: z.coerce.boolean().optional(),
  preferredPickupDate: z.coerce.date().optional(),

  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(150).optional(),
  landingPage: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),

  // Consumed by requireTurnstile before this schema is reached; declared
  // so the strip below does not treat it as an unknown extra.
  turnstileToken: z.string().optional(),
});

export type CreateScrapLeadParsed = z.infer<typeof createScrapLeadSchema>;
