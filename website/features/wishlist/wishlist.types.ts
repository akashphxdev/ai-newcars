// features/wishlist/wishlist.types.ts
//
// Mirrors admin-backend's modules/public/wishlist/wishlist.types.ts.

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

export interface WishlistItem {
  id: number;
  modelId: number;
  createdAt: string;
  model: WishlistItemModel;
}

export interface AddWishlistResult {
  id: number;
  modelId: number;
  duplicate: boolean;
}
