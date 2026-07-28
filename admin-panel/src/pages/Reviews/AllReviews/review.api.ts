// src/pages/Reviews/AllReviews/review.api.ts
//
// RTK Query version, same pattern as Articles/ArticleComments/articleComment.api.ts.

import { api } from "../../../store/baseApi";

export interface ReviewUserSummary {
  id: number;
  name: string;
}

export interface ReviewCategoryScore {
  id: number;
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
  status: string;
  userId: number | null;
  user: ReviewUserSummary | null;
  adminId: number | null;
  admin: ReviewUserSummary | null;
  createdAt: string;
}

export interface ReviewHelpfulVote {
  id: number;
  userId: number;
  user: ReviewUserSummary;
  createdAt: string;
}

export interface ReviewRecord {
  id: number;
  userId: number;
  user: ReviewUserSummary;
  modelId: number;
  model: { id: number; name: string; brand: { id: number; name: string } };
  variantId: number | null;
  variant: { id: number; variantName: string } | null;
  rating: string | null;
  title: string | null;
  body: string | null;
  ownershipDuration: string | null;
  kmDriven: number | null;
  isVerifiedOwner: boolean;
  status: "pending" | "approved" | "rejected";
  rejectedReason: string | null;
  helpfulCount: number;
  createdAt: string;
  categoryScores: ReviewCategoryScore[];
  images: ReviewImage[];
  replyCount: number;
}

export interface ReviewDetailRecord extends ReviewRecord {
  replies: ReviewReply[];
  helpfulVotes: ReviewHelpfulVote[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  modelId?: number;
  status?: "pending" | "approved" | "rejected";
  isVerifiedOwner?: boolean;
  sortBy?: "id" | "createdAt" | "rating" | "helpfulCount";
  sortOrder?: "asc" | "desc";
}

export interface UpdateReviewStatusInput {
  status: "approved" | "rejected";
  rejectedReason?: string;
}

interface ReviewListRawResponse {
  success: true;
  data: ReviewRecord[];
  pagination: Pagination;
}

interface ReviewDetailRawResponse {
  success: true;
  data: ReviewDetailRecord;
}

interface ReviewReplyRawResponse {
  success: true;
  data: ReviewReply;
}

export interface ReviewListResult {
  data: ReviewRecord[];
  pagination: Pagination;
}

const REVIEW_LIST_TAG = { type: "Review" as const, id: "LIST" };

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query<ReviewListResult, ListReviewsParams | void>({
      query: (params) => ({ url: "/reviews", method: "GET", params: params ?? {} }),
      transformResponse: (res: ReviewListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((r) => ({ type: "Review" as const, id: r.id })), REVIEW_LIST_TAG]
          : [REVIEW_LIST_TAG],
    }),

    getReviewById: builder.query<ReviewDetailRecord, number>({
      query: (id) => ({ url: `/reviews/${id}`, method: "GET" }),
      transformResponse: (res: ReviewDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Review", id }],
    }),

    updateReviewStatus: builder.mutation<void, { id: number; input: UpdateReviewStatusInput }>({
      query: ({ id, input }) => ({ url: `/reviews/${id}/status`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Review", id }, REVIEW_LIST_TAG],
    }),

    deleteReview: builder.mutation<void, number>({
      query: (id) => ({ url: `/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Review", id }, REVIEW_LIST_TAG],
    }),

    createReviewReply: builder.mutation<ReviewReply, { reviewId: number; body: string }>({
      query: ({ reviewId, body }) => ({ url: `/reviews/${reviewId}/replies`, method: "POST", data: { body } }),
      transformResponse: (res: ReviewReplyRawResponse) => res.data,
      invalidatesTags: (_result, _error, { reviewId }) => [{ type: "Review", id: reviewId }],
    }),

    deleteReviewReply: builder.mutation<void, { replyId: number; reviewId: number }>({
      query: ({ replyId }) => ({ url: `/reviews/replies/${replyId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { reviewId }) => [{ type: "Review", id: reviewId }],
    }),
  }),
});

export const {
  useGetReviewsQuery,
  useGetReviewByIdQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
  useCreateReviewReplyMutation,
  useDeleteReviewReplyMutation,
} = reviewApi;
