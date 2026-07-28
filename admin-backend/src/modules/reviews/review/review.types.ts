// src/modules/reviews/review/review.types.ts

export interface ReviewUserSummary {
  id: number;
  name: string;
}

export interface ReviewAdminSummary {
  id: number;
  name: string;
}

export interface ReviewModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

export interface ReviewVariantSummary {
  id: number;
  variantName: string;
}

export interface ReviewCategoryScoreRecord {
  id: number;
  category: string | null;
  score: string | null;
}

export interface ReviewImageRecord {
  id: number;
  imageUrl: string;
}

export interface ReviewReplyRecord {
  id: number;
  body: string;
  status: string;
  userId: number | null;
  user: ReviewUserSummary | null;
  adminId: number | null;
  admin: ReviewAdminSummary | null;
  createdAt: Date;
}

export interface ReviewHelpfulVoteRecord {
  id: number;
  userId: number;
  user: ReviewUserSummary;
  createdAt: Date;
}

export interface ReviewRecord {
  id: number;
  userId: number;
  user: ReviewUserSummary;
  modelId: number;
  model: ReviewModelSummary;
  variantId: number | null;
  variant: ReviewVariantSummary | null;
  rating: string | null;
  title: string | null;
  body: string | null;
  ownershipDuration: string | null;
  kmDriven: number | null;
  isVerifiedOwner: boolean;
  status: string;
  rejectedReason: string | null;
  helpfulCount: number;
  createdAt: Date;
  categoryScores: ReviewCategoryScoreRecord[];
  images: ReviewImageRecord[];
  replyCount: number;
}

// GET /reviews/:id only — the list endpoint deliberately skips these two
// (replies can be many, helpful-vote rows can be many) so the list
// response stays lean; the admin panel fetches this only when a row is
// expanded.
export interface ReviewDetailRecord extends ReviewRecord {
  replies: ReviewReplyRecord[];
  helpfulVotes: ReviewHelpfulVoteRecord[];
}
