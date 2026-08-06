// src/modules/public/wishlist/wishlist.types.ts

export interface WishlistItemModel {
  id: number;
  name: string;
  slug: string;
  launchStatus: string;
  priceMin: string | null;
  priceMax: string | null;
  coverImageUrl: string | null;
  brand: { id: number; name: string; slug: string };
}

export interface WishlistItemRecord {
  id: number;
  modelId: number;
  createdAt: Date;
  model: WishlistItemModel;
}
