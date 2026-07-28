// features/reviews/review.types.ts
//
// Mirrors admin-backend's modules/public/reviews/review types.

export interface ReviewUserSummary {
  id: number;
  name: string;
}

export interface ReviewCategoryScore {
  category: string | null;
  score: string | null;
}

export interface ReviewImage {
  id: number;
  imageUrl: string;
}

export interface ReviewReply {
  id: number;
  body: string;
  userId: number | null;
  user: ReviewUserSummary | null;
  adminId: number | null;
  admin: ReviewUserSummary | null;
  createdAt: string;
}

export interface ReviewResult {
  id: number;
  user: ReviewUserSummary;
  variant: { id: number; variantName: string } | null;
  rating: string | null;
  title: string | null;
  body: string | null;
  ownershipDuration: string | null;
  kmDriven: number | null;
  isVerifiedOwner: boolean;
  helpfulCount: number;
  hasMarkedHelpful: boolean;
  createdAt: string;
  categoryScores: ReviewCategoryScore[];
  images: ReviewImage[];
  replies: ReviewReply[];
}

export interface ReviewsSummary {
  averageRating: number | null;
  totalReviews: number;
  ratingBreakdown: { star: number; count: number }[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListReviewsResult {
  reviews: ReviewResult[];
  pagination: Pagination;
  summary: ReviewsSummary;
}

export interface SubmitReviewInput {
  modelId: number;
  variantId?: number;
  rating: number;
  title?: string;
  body: string;
  ownershipDuration?: string;
  kmDriven?: number;
  categoryScores?: { category: string; score: number }[];
}
