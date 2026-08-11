// features/seo/seo.types.ts

// Mirrors admin-backend's SEO_PAGE_TYPE_CODES
// (admin-backend/src/modules/seo/seoMeta/seoMeta.validation.ts).
export const SEO_PAGE_TYPE = {
  BRAND: 1,
  MODEL: 2,
  DETAIL: 3,
  STATIC: 4,
  NEWS_CATEGORY: 5,
  BODY_TYPE: 6,
} as const;

export type SeoPageType = (typeof SEO_PAGE_TYPE)[keyof typeof SEO_PAGE_TYPE];

export interface SeoMetaQuery {
  pageType: SeoPageType;
  entityId?: number;
  staticPageSlug?: string;
}

export interface PublicSeoMeta {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  h1Tag: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robotsMeta: string | null;
  vehicleSchema: string | null;
  reviewSchema: string | null;
  articleSchema: string | null;
  authorSchema: string | null;
  breadcrumbSchema: string | null;
}

// oldPath/newPath are always path-only (no host/query, always start with
// "/") — see admin-backend's seoRedirect.validation.ts pathSchema — so
// they can be matched directly against a request's pathname.
export interface PublicSeoRedirect {
  oldPath: string;
  newPath: string;
  redirectType: 301 | 302;
}
