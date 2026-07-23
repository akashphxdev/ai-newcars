// src/modules/public/home/banner/banner.types.ts
//
// Public-safe shape — no createdBy/updatedBy/audit fields, no admin
// summaries. Only what the website actually needs to render a banner.

export interface PublicBannerRecord {
  id: number;
  tagLabel: string;
  heading: string;
  highlightText: string;
  description: string;
  mediaType: number; // 1=Image, 2=Video
  imageUrl: string | null;
  videoUrl: string | null;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
}
