// src/modules/newCars/offer/offer.types.ts

export interface OfferModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

export interface OfferVariantSummary {
  id: number;
  variantName: string;
}

export interface OfferCitySummary {
  id: number;
  name: string;
}

export interface OfferRecord {
  id: number;
  modelId: number;
  variantId: number | null;
  cityId: number | null;
  offerType: string | null;
  // Decimal field comes back from Prisma serialized as a string — same
  // convention as VariantRecord's price.
  offerAmount: string | null;
  description: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  model: OfferModelSummary;
  variant: OfferVariantSummary | null;
  city: OfferCitySummary | null;
}