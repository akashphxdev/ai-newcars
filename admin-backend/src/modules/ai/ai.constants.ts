// src/modules/ai/ai.constants.ts

// Numeric codes only — labels live on the frontend
// (admin-panel/src/lib/aiLookups.ts). Backend just needs to know which
// codes are currently valid. Same convention as
// adPlacement.validation.ts's PAGE_TYPE_CODES/AD_TYPE_CODES.
//   1 = Ollama (local), 2 = OpenAI, 3 = Anthropic (Claude), 4 = Google Gemini
export const AI_PROVIDER_CODES = [1, 2, 3, 4] as const;
export type AiProviderCode = (typeof AI_PROVIDER_CODES)[number];

//   1 = Article Generator, 2 = Story Generator, 3 = SEO Generator, 4 = FAQ Generator
export const AI_FEATURE_CODES = [1, 2, 3, 4] as const;
export type AiFeatureCode = (typeof AI_FEATURE_CODES)[number];

// AiFaq.status — a generated FAQ moves pending -> approved/rejected, and
// approved -> published (which is the only transition that creates the
// real CarFaq row). published/rejected are both terminal.
//   1 = Pending, 2 = Approved, 3 = Rejected, 4 = Published
export const AI_FAQ_STATUS_CODES = [1, 2, 3, 4] as const;
export type AiFaqStatusCode = (typeof AI_FAQ_STATUS_CODES)[number];

export const AI_FAQ_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  PUBLISHED: 4,
} as const;
