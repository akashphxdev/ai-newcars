// src/pages/Ai/Articles/aiArticle.api.ts
import { api } from "../../../store/baseApi";

export interface AiArticleCategorySummary {
  id: number;
  name: string;
  slug: string;
}

export interface AiArticleBrandSummary {
  id: number;
  name: string;
}

export interface AiArticleModelSummary {
  id: number;
  name: string;
}

export interface AiArticleAdminSummary {
  id: number;
  name: string;
}

export interface AiArticleRecord {
  id: number;
  categoryId: number;
  category: AiArticleCategorySummary;
  brandId: number;
  brand: AiArticleBrandSummary;
  modelId: number | null;
  model: AiArticleModelSummary | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  sourceImagePoolId: number;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  status: number;
  aiProvider: number;
  aiModel: string;
  publishedArticleId: number | null;
  reviewedBy: number | null;
  reviewedByAdmin: AiArticleAdminSummary | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAiArticlesParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: number;
  status?: number;
  sortBy?: "createdAt" | "id";
  sortOrder?: "asc" | "desc";
}

export interface UpdateAiArticleInput {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

interface AiArticleListRawResponse {
  success: true;
  data: AiArticleRecord[];
  pagination: Pagination;
}

interface AiArticleSingleRawResponse {
  success: true;
  data: AiArticleRecord;
}

export interface AiArticleListResult {
  data: AiArticleRecord[];
  pagination: Pagination;
}

const AI_ARTICLE_LIST_TAG = { type: "AiArticle" as const, id: "LIST" };
// The real, live Article list (Articles/Articles/article.api.ts) needs
// to refresh too once a publish creates a row there — same tag type it
// already provides/invalidates on its own list.
const ARTICLE_LIST_TAG = { type: "Article" as const, id: "LIST" };

export const aiArticleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiArticles: builder.query<AiArticleListResult, ListAiArticlesParams | void>({
      query: (params) => ({ url: "/ai/articles", method: "GET", params: params ?? {} }),
      transformResponse: (res: AiArticleListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((a) => ({ type: "AiArticle" as const, id: a.id })), AI_ARTICLE_LIST_TAG]
          : [AI_ARTICLE_LIST_TAG],
    }),

    getAiArticleById: builder.query<AiArticleRecord, number>({
      query: (id) => ({ url: `/ai/articles/${id}`, method: "GET" }),
      transformResponse: (res: AiArticleSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "AiArticle", id }],
    }),

    updateAiArticle: builder.mutation<AiArticleRecord, { id: number; input: UpdateAiArticleInput }>({
      query: ({ id, input }) => ({ url: `/ai/articles/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: AiArticleSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AiArticle", id }, AI_ARTICLE_LIST_TAG],
    }),

    approveAiArticle: builder.mutation<AiArticleRecord, number>({
      query: (id) => ({ url: `/ai/articles/${id}/approve`, method: "PATCH" }),
      transformResponse: (res: AiArticleSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiArticle", id }, AI_ARTICLE_LIST_TAG],
    }),

    rejectAiArticle: builder.mutation<AiArticleRecord, number>({
      query: (id) => ({ url: `/ai/articles/${id}/reject`, method: "PATCH" }),
      transformResponse: (res: AiArticleSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiArticle", id }, AI_ARTICLE_LIST_TAG],
    }),

    publishAiArticle: builder.mutation<AiArticleRecord, number>({
      query: (id) => ({ url: `/ai/articles/${id}/publish`, method: "PATCH" }),
      transformResponse: (res: AiArticleSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiArticle", id }, AI_ARTICLE_LIST_TAG, ARTICLE_LIST_TAG],
    }),

    deleteAiArticle: builder.mutation<void, number>({
      query: (id) => ({ url: `/ai/articles/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "AiArticle", id }, AI_ARTICLE_LIST_TAG],
    }),
  }),
});

export const {
  useGetAiArticlesQuery,
  useGetAiArticleByIdQuery,
  useUpdateAiArticleMutation,
  useApproveAiArticleMutation,
  useRejectAiArticleMutation,
  usePublishAiArticleMutation,
  useDeleteAiArticleMutation,
} = aiArticleApi;
