// src/modules/newCars/feature/feature.types.ts

export interface FeatureRecord {
  id: number;
  name: string;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  createdAt: Date;
}
