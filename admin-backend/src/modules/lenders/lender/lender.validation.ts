// src/modules/lenders/lender/lender.validation.ts

import { z } from 'zod';

// Same string->boolean coercion as brand.validation.ts's booleanish —
// multipart form fields (logo upload) always arrive as strings.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

const interestRateSchema = z.coerce.number().min(0).max(99.99);

export const lenderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const lenderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Lightweight query for the /options endpoint — no page/limit/search,
// this always returns the full unpaginated set for dropdown use (the
// Loan Lead form's "Preferred Lender" field).
export const lenderOptionsQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
});

// Only `name` is required — everything else is a nullable/optional
// column in schema.prisma, so it's optional here too. Logo is likewise
// optional (unlike Brand's mandatory logo): a lender can be added with
// just a name and filled in later.
export const createLenderSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
    minInterestRate: interestRateSchema.optional(),
    maxInterestRate: interestRateSchema.optional(),
    maxLoanAmount: z.coerce.number().min(0).optional(),
    maxTenureYears: z.coerce.number().int().min(1).max(30).optional(),
    isActive: booleanish.optional(),
  })
  .refine((data) => data.minInterestRate == null || data.maxInterestRate == null || data.maxInterestRate >= data.minInterestRate, {
    message: 'Max interest rate must be greater than or equal to min interest rate',
    path: ['maxInterestRate'],
  });

// Explicit `null` clears a field, `undefined`/omitted leaves it
// untouched — mirrors brand.validation.ts's updateBrandSchema pattern
// for countryOriginId.
export const updateLenderSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    minInterestRate: interestRateSchema.nullable().optional(),
    maxInterestRate: interestRateSchema.nullable().optional(),
    maxLoanAmount: z.coerce.number().min(0).nullable().optional(),
    maxTenureYears: z.coerce.number().int().min(1).max(30).nullable().optional(),
    isActive: booleanish.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided to update' })
  .refine((data) => data.minInterestRate == null || data.maxInterestRate == null || data.maxInterestRate >= data.minInterestRate, {
    message: 'Max interest rate must be greater than or equal to min interest rate',
    path: ['maxInterestRate'],
  });

export const updateLenderStatusSchema = z.object({
  isActive: z.boolean(),
});

export type LenderListQueryParsed = z.infer<typeof lenderListQuerySchema>;
export type LenderOptionsQueryParsed = z.infer<typeof lenderOptionsQuerySchema>;
export type CreateLenderParsed = z.infer<typeof createLenderSchema>;
export type UpdateLenderParsed = z.infer<typeof updateLenderSchema>;
export type UpdateLenderStatusParsed = z.infer<typeof updateLenderStatusSchema>;
