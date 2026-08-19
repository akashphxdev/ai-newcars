// src/modules/landingPages/landingPage.types.ts

export interface LandingPageRecord {
  slug: string;
  url: string;
  // False when the directory exists but holds no index.html, which is a
  // page that would 404 for visitors.
  hasIndex: boolean;
  title: string | null;
  assetCount: number;
  sizeBytes: number;
  updatedAt: string | null;
}
