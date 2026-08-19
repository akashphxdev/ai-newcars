// src/modules/landingPages/landingPage.validation.ts

import { z } from 'zod';

export const landingPageSlugSchema = z.object({
  slug: z.string().trim().min(1).max(80),
});

export const saveLandingPageSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  // The whole document, as authored. It is served verbatim, so it is
  // stored verbatim — rewriting an admin's markup would be a surprise.
  html: z.string().min(1).max(2_000_000),
});

export type SaveLandingPageParsed = z.infer<typeof saveLandingPageSchema>;
