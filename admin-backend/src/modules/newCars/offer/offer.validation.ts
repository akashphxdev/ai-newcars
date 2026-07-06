// src/modules/newCars/offer/offer.validation.ts

import { z } from 'zod';

// Free-text on the DB (VARCHAR(30), no enum) — this list is just the
// suggested set shown in the frontend dropdown, not a hard constraint.
export const OFFER_TYPES = [
  'cash_discount',
  'exchange_bonus',
  'corporate_discount',
  'loyalty_bonus',
  'finance_offer',
  'other',
] as const;

export const offerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  variantId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['id', 'validFrom', 'validUntil', 'offerAmount']).default('id'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const offerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// modelId is the only mandatory field — everything else mirrors the
// schema's own nullability (variantId/cityId/offerType/offerAmount/
// description/validFrom/validUntil are all optional columns).
// Both create and update share this shape (full-replace on edit, same
// convention as faq.validation.ts / variant.validation.ts) — the
// frontend always submits the complete form on Add and Edit.
const offerShape = {
  modelId: z.coerce.number().int().positive('modelId is required'),
  variantId: z.coerce.number().int().positive().nullable().optional(),
  cityId: z.coerce.number().int().positive().nullable().optional(),
  offerType: z.string().trim().max(30).nullable().optional(),
  offerAmount: z.coerce.number().positive('Offer amount must be greater than 0').nullable().optional(),
  description: z.string().trim().max(255).nullable().optional(),
  validFrom: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  isActive: z.boolean({
    required_error: 'isActive is required',
    invalid_type_error: 'isActive must be true or false',
  }),
};

export const createOfferSchema = z
  .object(offerShape)
  .refine(
    (data) => !data.validFrom || !data.validUntil || data.validFrom <= data.validUntil,
    { message: 'validFrom must be on or before validUntil', path: ['validUntil'] },
  );

export const updateOfferSchema = createOfferSchema;

export type OfferListQueryParsed = z.infer<typeof offerListQuerySchema>;
export type CreateOfferParsed = z.infer<typeof createOfferSchema>;
export type UpdateOfferParsed = z.infer<typeof updateOfferSchema>;
export type OfferTypeValue = (typeof OFFER_TYPES)[number];