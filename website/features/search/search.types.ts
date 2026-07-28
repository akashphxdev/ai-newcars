// features/search/search.types.ts
//
// Mirrors admin-backend's modules/public/search types.

export interface SearchCarResult {
  id: number;
  name: string;
  slug: string;
  brand: { name: string; slug: string };
  coverImageUrl: string | null;
  priceMin: string | null;
}

export interface SearchCarsResult {
  query: string;
  results: SearchCarResult[];
}
