// features/usedCars/usedCar.types.ts

export interface UsedCarListing {
  id: number;
  price: string | null;
  year: number | null;
  kmDriven: number | null;
  ownerCount: number | null;
  isInspected: boolean;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  imageUrl: string | null;
}

export interface UsedCarsByCity {
  city: { id: number; name: string; slug: string };
  listings: UsedCarListing[];
}
