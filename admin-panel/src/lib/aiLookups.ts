// src/lib/aiLookups.ts
//
// AI Content Studio's numeric-code lookups — kept separate from
// lib/lookups.ts by explicit request, so AI-related option lists don't
// mix in with the rest of the app's dropdown data.

export interface LookupOption {
  value: number;
  label: string;
}

// ===== AI providers =====
// Mirrors AI_PROVIDER_CODES in admin-backend/src/modules/ai/ai.constants.ts —
// keep both in sync if a code is ever added/removed.
export const AI_PROVIDER_OPTIONS: LookupOption[] = [
  { value: 1, label: "Ollama (Local)" },
  { value: 2, label: "OpenAI" },
  { value: 3, label: "Anthropic (Claude)" },
  { value: 4, label: "Google Gemini" },
];

export function getAiProviderLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return AI_PROVIDER_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== AI feature keys =====
// Mirrors AI_FEATURE_CODES in admin-backend/src/modules/ai/ai.constants.ts.
export const AI_FEATURE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Article Generator" },
  { value: 2, label: "Story Generator" },
  { value: 3, label: "SEO Generator" },
  { value: 4, label: "FAQ Generator" },
];

export function getAiFeatureLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return AI_FEATURE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== AI FAQ review status =====
// Mirrors AI_FAQ_STATUS_CODES / AI_FAQ_STATUS in
// admin-backend/src/modules/ai/ai.constants.ts. pending -> approved/rejected,
// approved -> published (the only transition that creates a real FAQ).
export const AI_FAQ_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  PUBLISHED: 4,
} as const;

export const AI_FAQ_STATUS_OPTIONS: LookupOption[] = [
  { value: AI_FAQ_STATUS.PENDING, label: "Pending" },
  { value: AI_FAQ_STATUS.APPROVED, label: "Approved" },
  { value: AI_FAQ_STATUS.REJECTED, label: "Rejected" },
  { value: AI_FAQ_STATUS.PUBLISHED, label: "Published" },
];

export function getAiFaqStatusLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return AI_FAQ_STATUS_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== AI log status =====
// Mirrors the caller-defined status convention in createAiLog.ts /
// AI_LOG_STATUS in aiFaq.service.ts (the only writer today).
export const AI_LOG_STATUS = {
  SUCCESS: 1,
  FAILED: 2,
} as const;

export const AI_LOG_STATUS_OPTIONS: LookupOption[] = [
  { value: AI_LOG_STATUS.SUCCESS, label: "Success" },
  { value: AI_LOG_STATUS.FAILED, label: "Failed" },
];

export function getAiLogStatusLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return AI_LOG_STATUS_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== AI story item review status =====
// Mirrors AI_STORY_ITEM_STATUS_CODES / AI_STORY_ITEM_STATUS in
// admin-backend/src/modules/ai/ai.constants.ts. pending -> approved/rejected,
// approved -> published (the only transition that creates a real story item).
export const AI_STORY_ITEM_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  PUBLISHED: 4,
} as const;

export const AI_STORY_ITEM_STATUS_OPTIONS: LookupOption[] = [
  { value: AI_STORY_ITEM_STATUS.PENDING, label: "Pending" },
  { value: AI_STORY_ITEM_STATUS.APPROVED, label: "Approved" },
  { value: AI_STORY_ITEM_STATUS.REJECTED, label: "Rejected" },
  { value: AI_STORY_ITEM_STATUS.PUBLISHED, label: "Published" },
];

export function getAiStoryItemStatusLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return AI_STORY_ITEM_STATUS_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== AI Article review status =====
// Mirrors AI_ARTICLE_STATUS_CODES / AI_ARTICLE_STATUS in
// admin-backend/src/modules/ai/ai.constants.ts. pending -> approved/rejected,
// approved -> published (the only transition that creates a real Article).
export const AI_ARTICLE_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  PUBLISHED: 4,
} as const;

export const AI_ARTICLE_STATUS_OPTIONS: LookupOption[] = [
  { value: AI_ARTICLE_STATUS.PENDING, label: "Pending" },
  { value: AI_ARTICLE_STATUS.APPROVED, label: "Approved" },
  { value: AI_ARTICLE_STATUS.REJECTED, label: "Rejected" },
  { value: AI_ARTICLE_STATUS.PUBLISHED, label: "Published" },
];

export function getAiArticleStatusLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return AI_ARTICLE_STATUS_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}