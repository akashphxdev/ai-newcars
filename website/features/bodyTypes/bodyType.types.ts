// features/bodyTypes/bodyType.types.ts
//
// Mirrors admin-backend's PublicHomeBodyTypeRecord (modules/public/home/bodyType).

export interface BodyType {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
}
