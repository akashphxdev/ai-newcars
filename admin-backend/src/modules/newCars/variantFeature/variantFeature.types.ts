// src/modules/newCars/variantFeature/variantFeature.types.ts

export interface VariantFeatureAssignment {
  featureId: number;
  value: string | null;
}

export interface FeatureCatalogItem {
  id: number;
  name: string;
}

export interface FeatureCatalogGroup {
  categoryId: number | null;
  categoryName: string;
  features: FeatureCatalogItem[];
}

// Row shape for the "variants that already have features assigned"
// listing — deliberately excludes variants with zero assignments (see
// variantFeature.service.ts's listVariantsWithFeatures).
export interface VariantWithFeaturesRecord {
  id: number;
  variantName: string;
  price: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
  featureCount: number;
}
