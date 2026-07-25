// features/banners/banner.types.ts
//
// Mirrors admin-backend's PublicBannerRecord (modules/public/home/banner).

export interface Banner {
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
