// src/modules/public/reviews/review/review.types.ts

export interface PublicReviewUserSummary {
  id: number;
  name: string;
}

export interface PublicReviewCategoryScore {
  category: string | null;
  score: string | null;
}

export interface PublicReviewImage {
  id: number;
  imageUrl: string;
}

export interface PublicReviewReply {
  id: number;
  body: string;
  userId: number | null;
  user: PublicReviewUserSummary | null;
  adminId: number | null;
  admin: PublicReviewUserSummary | null;
  createdAt: string;
}

export interface PublicReviewResult {
  id: number;
  user: PublicReviewUserSummary;
  variant: { id: number; variantName: string } | null;
  rating: string | null;
  title: string | null;
  body: string | null;
  ownershipDuration: string | null;
  kmDriven: number | null;
  isVerifiedOwner: boolean;
  helpfulCount: number;
  // Only meaningful when the request carried a valid user token — false
  // for anonymous visitors, never used to gate visibility, only to show
  // "you marked this helpful" state on the button.
  hasMarkedHelpful: boolean;
  createdAt: string;
  categoryScores: PublicReviewCategoryScore[];
  images: PublicReviewImage[];
  replies: PublicReviewReply[];
}

export interface ReviewsSummary {
  averageRating: number | null;
  totalReviews: number;
  ratingBreakdown: { star: number; count: number }[];
}

export interface ListReviewsResult {
  reviews: PublicReviewResult[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: ReviewsSummary;
}
