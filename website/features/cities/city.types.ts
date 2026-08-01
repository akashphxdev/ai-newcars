// features/cities/city.types.ts
//
// Mirrors admin-backend's PublicHomeCityRecord (modules/public/home/city).

export interface HomeCity {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

// Mirrors admin-backend's public /cities/options — lightweight,
// unpaginated, every city in one shot. Used wherever City is just a
// dropdown/datalist (lead-form city field), not the homepage carousel.
export interface CityOption {
  id: number;
  name: string;
}
