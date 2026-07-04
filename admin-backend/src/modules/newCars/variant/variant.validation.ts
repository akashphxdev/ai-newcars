// src/modules/newCars/variant/variant.validation.ts

import { z } from 'zod';

const TRANSMISSIONS = ['manual', 'automatic', 'amt', 'cvt', 'dct'] as const;

export const variantListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  isTopSeller: z.coerce.boolean().optional(),
  sortBy: z.enum(['variantName', 'id', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const variantIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Every field below is mandatory on BOTH create and update — this module
// intentionally does NOT follow Brand/CarModel's "partial patch" pattern.
// The frontend always sends the complete form on Add and on Edit, so
// create and update share the exact same required shape.
const variantShape = {
  modelId: z.coerce.number().int().positive('modelId is required'),
  variantName: z.string().trim().min(2, 'Variant name must be at least 2 characters').max(100),
  price: z.coerce.number().positive('Price is required and must be greater than 0'),
  seatingCapacity: z.coerce
    .number()
    .int('Seating capacity must be a whole number')
    .min(2, 'Seating capacity must be at least 2')
    .max(15, 'Seating capacity must be 15 or less'),
  transmission: z.enum(TRANSMISSIONS, {
    required_error: 'Transmission is required',
    invalid_type_error: 'Transmission is required',
  }),
  isTopSeller: z.boolean({
    required_error: 'isTopSeller is required',
    invalid_type_error: 'isTopSeller must be true or false',
  }),
};

export const createVariantSchema = z.object(variantShape);

export const updateVariantSchema = z.object(variantShape);

export type VariantListQueryParsed = z.infer<typeof variantListQuerySchema>;
export type CreateVariantParsed = z.infer<typeof createVariantSchema>;
export type UpdateVariantParsed = z.infer<typeof updateVariantSchema>;
export type TransmissionType = (typeof TRANSMISSIONS)[number];