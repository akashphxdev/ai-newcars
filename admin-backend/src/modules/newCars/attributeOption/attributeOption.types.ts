// src/modules/newCars/attributeOption/attributeOption.types.ts

export interface AttributeOptionItem {
  id: number;
  category: string;
  name: string;
  slug: string;
}

// Shape returned by GET /attribute-options/grouped — used by the frontend
// to populate multiple dropdowns (transmission, drivetrain, ...) from a
// single request instead of one call per category.
export type AttributeOptionsGrouped = Record<string, AttributeOptionItem[]>;