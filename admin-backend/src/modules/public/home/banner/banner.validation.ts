// src/modules/public/home/banner/banner.validation.ts

import { z } from 'zod';

export const bannerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
