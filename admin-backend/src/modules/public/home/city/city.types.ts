// src/modules/public/home/city/city.types.ts
//
// Public-safe shape — no district/state/country chain, only what the
// website's TrustedUsedCars section needs.

export interface PublicHomeCityRecord {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}
