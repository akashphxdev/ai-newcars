// src/modules/public/bodyTypes/bodyType/bodyType.types.ts

export interface BodyTypeDetail {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
}

// Nav-chip shape — deliberately its own interface (not extending
// BodyTypeDetail) since listAllBodyTypesWithCounts doesn't select
// `description`, only what the "explore other body types" chips need.
export interface BodyTypeWithCount {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  count: number;
}
