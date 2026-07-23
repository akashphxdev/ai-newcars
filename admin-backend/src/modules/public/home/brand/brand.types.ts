// src/modules/public/home/brand/brand.types.ts
//
// Public-safe shape — no countryOrigin/audit fields, only what the
// website's PopularBrands section needs.

export interface PublicHomeBrandRecord {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}
