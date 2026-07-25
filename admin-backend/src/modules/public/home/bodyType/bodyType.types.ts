// src/modules/public/home/bodyType/bodyType.types.ts
//
// Public-safe shape — only what the website's "Search By Category"
// section needs.

export interface PublicHomeBodyTypeRecord {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
}
