// features/cities/city.types.ts
//
// Mirrors admin-backend's PublicHomeCityRecord (modules/public/home/city).

export interface HomeCity {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}
