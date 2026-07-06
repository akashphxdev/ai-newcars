// src/modules/newCars/faq/faq.validation.ts

import { z } from 'zod';

export const faqListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['displayOrder', 'id', 'createdAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const faqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Every field below is mandatory on BOTH create and update — same
// convention as variant.validation.ts: the frontend always submits the
// complete form, on both Add and Edit, so create/update share one shape.
const faqShape = {
  modelId: z.coerce.number().int().positive('modelId is required'),
  question: z.string().trim().min(5, 'Question must be at least 5 characters').max(255),
  answer: z.string().trim().min(2, 'Answer is required'),
  displayOrder: z.coerce
    .number()
    .int('Display order must be a whole number')
    .min(0, 'Display order cannot be negative'),
  isActive: z.boolean({
    required_error: 'isActive is required',
    invalid_type_error: 'isActive must be true or false',
  }),
};

export const createFaqSchema = z.object(faqShape);

export const updateFaqSchema = z.object(faqShape);

export type FaqListQueryParsed = z.infer<typeof faqListQuerySchema>;
export type CreateFaqParsed = z.infer<typeof createFaqSchema>;
export type UpdateFaqParsed = z.infer<typeof updateFaqSchema>;