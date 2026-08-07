// src/modules/seo/seoRedirect/seoRedirect.types.ts

export interface SeoRedirectAdminSummary {
  id: number;
  name: string;
}

export interface SeoRedirectRecord {
  id: number;
  oldPath: string;
  newPath: string;
  redirectType: number;
  isActive: boolean;
  createdBy: number | null;
  createdByAdmin: SeoRedirectAdminSummary | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedByAdmin: SeoRedirectAdminSummary | null;
  updatedAt: Date;
}
