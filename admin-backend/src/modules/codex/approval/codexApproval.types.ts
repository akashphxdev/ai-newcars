export const CODEX_ENTITIES = [
  'brands',
  'car-models',
  'car-variants',
  'powertrains-ice',
  'powertrains-electric',
  'feature-categories',
  'features',
  'variant-features',
  'car-colors',
  'car-color-shades',
  'car-images',
  'articles',
  'article-brands',
  'article-car-models',
  'car-faqs',
] as const;

export type CodexEntity = (typeof CODEX_ENTITIES)[number];

export interface CodexListQuery {
  page: number;
  limit: number;
  status?: 'pending' | 'rejected';
  search?: string;
  runId?: bigint;
  sortOrder: 'asc' | 'desc';
}

export interface CodexRunListQuery {
  page: number;
  limit: number;
  status?: string;
  taskType?: string;
  sortOrder: 'asc' | 'desc';
}
