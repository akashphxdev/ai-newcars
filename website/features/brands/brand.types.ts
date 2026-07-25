// features/brands/brand.types.ts
//
// Mirrors admin-backend's PublicHomeBrandRecord (modules/public/home/brand).

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}
