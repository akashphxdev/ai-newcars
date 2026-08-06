// src/modules/seo/seoMeta/seoMeta.types.ts

export interface SeoMetaAdminSummary {
  id: number;
  name: string;
}

export interface SeoMetaRecord {
  id: number;
  // See SEO_PAGE_TYPE_CODES in seoMeta.validation.ts.
  pageType: number;
  entityId: number | null;
  staticPageSlug: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  h1Tag: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robotsMeta: string | null;

  // ---- structured data / JSON-LD (raw JSON strings, one per schema.org
  // type). Nullable — a page rarely needs all of them at once (e.g. a
  // brand listing page won't have a reviewSchema). See SCHEMA_JSON_FIELDS
  // in seoMeta.validation.ts for the shared validation rule. ----
  vehicleSchema: string | null;
  faqSchema: string | null;
  reviewSchema: string | null;
  articleSchema: string | null;
  authorSchema: string | null;
  breadcrumbSchema: string | null;

  status: boolean;
  createdBy: number | null;
  createdByAdmin: SeoMetaAdminSummary | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedByAdmin: SeoMetaAdminSummary | null;
  updatedAt: Date;
}