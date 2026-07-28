// src/modules/public/search/search.types.ts

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
