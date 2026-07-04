// src/modules/locations/country/country.validation.ts

import { z } from 'zod';

export const countryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const countryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// distanceUnit / fuelUnit are constrained to a fixed set of values —
// same style as status enums elsewhere (e.g. admin.validation.ts).
const distanceUnitEnum = z.enum(['KM', 'Miles']);
const fuelUnitEnum = z.enum(['Liter', 'Gallon']);

const currencyCodeRegex = /^[A-Z]{3}$/;

export const createCountrySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Code must be at least 2 characters')
    .max(5, 'Code must be at most 5 characters'),
  currency: z.string().trim().min(2, 'Currency name must be at least 2 characters').max(50),
  currencySymbol: z.string().trim().min(1, 'Currency symbol is required').max(10),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(currencyCodeRegex, 'Currency code must be 3 uppercase letters (e.g. INR, USD)'),
  exchangeRate: z.coerce.number().positive('Exchange rate must be greater than 0'),
  distanceUnit: distanceUnitEnum,
  fuelUnit: fuelUnitEnum,
  isActive: z.boolean(),
});

export const updateCountrySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().toUpperCase().min(2).max(5).optional(),
    currency: z.string().trim().min(2).max(50).optional(),
    currencySymbol: z.string().trim().min(1).max(10).optional(),
    currencyCode: z.string().trim().toUpperCase().regex(currencyCodeRegex).optional(),
    exchangeRate: z.coerce.number().positive('Exchange rate must be greater than 0').optional(),
    distanceUnit: distanceUnitEnum.optional(),
    fuelUnit: fuelUnitEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });
export const updateCountryStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CountryListQueryParsed = z.infer<typeof countryListQuerySchema>;
export type CreateCountryParsed = z.infer<typeof createCountrySchema>;
export type UpdateCountryParsed = z.infer<typeof updateCountrySchema>;
export type UpdateCountryStatusParsed = z.infer<typeof updateCountryStatusSchema>;