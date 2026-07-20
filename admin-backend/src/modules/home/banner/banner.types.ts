// src/modules/home/banner/banner.types.ts

export interface BannerAdminSummary {
  id: number;
  name: string;
}

export interface BannerRecord {
  id: number;
  name: string;
  tagLabel: string;
  heading: string;
  highlightText: string;
  description: string;
  // 1=Image, 2=Video — see BANNER_MEDIA_TYPE_CODES in banner.validation.ts.
  mediaType: number;
  imageUrl: string | null;
  videoUrl: string | null;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  isActive: boolean;
  clickCount: number;
  createdBy: number;
  createdByAdmin: BannerAdminSummary;
  updatedBy: number | null;
  updatedByAdmin: BannerAdminSummary | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface BannerUploadMediaResult {
  id: number;
  mediaType: number;
  imageUrl: string | null;
  videoUrl: string | null;
}
