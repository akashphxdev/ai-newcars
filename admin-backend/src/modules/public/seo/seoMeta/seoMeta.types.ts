// src/modules/public/seo/seoMeta/seoMeta.types.ts

export interface PublicSeoMetaRecord {
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
