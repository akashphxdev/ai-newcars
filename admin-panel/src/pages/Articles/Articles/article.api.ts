// src/pages/Articles/Articles/article.api.ts
//
// RTK Query version, same pattern as brand.api.ts (FormData upload) +
// offer.api.ts (status field).

import { api } from "../../../store/baseApi";

export type ArticleStatus = "draft" | "scheduled" | "published";

export interface ArticleTagRef {
  id: number;
  name: string;
}

export interface ArticleRecord {
  id: number;
  categoryId: number;
  category: { id: number; name: string; slug: string };
  authorId: number;
  author: { id: number; name: string };
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  coverImageUrl: string | null;
  readTimeMinutes: number | null;
  status: ArticleStatus;
  isActive: boolean;
  scheduledAt: string | null;
  publishedAt: string | null;
  viewCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  brands: ArticleTagRef[];
  models: ArticleTagRef[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListArticlesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  brandId?: number;
  modelId?: number;
  status?: ArticleStatus;
  isActive?: boolean;
  sortBy?: "id" | "title" | "createdAt" | "publishedAt" | "viewCount";
  sortOrder?: "asc" | "desc";
}

// Shared shape for both create and update — the editor always submits
// the complete form (full-replace), same convention as offer/brand.
export interface ArticleFormInput {
  categoryId: number;
  authorId: number;
  title: string;
  slug?: string;
  excerpt?: string | null;
  body: string;
  readTimeMinutes?: number | null;
  status: ArticleStatus;
  isActive: boolean;
  scheduledAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  brandIds: number[];
  modelIds: number[];
  // Optional — a draft can be saved without a cover image and have one
  // added later.
  coverImage?: File;
}

interface ArticleListRawResponse {
  success: true;
  data: ArticleRecord[];
  pagination: Pagination;
}

interface ArticleSingleRawResponse {
  success: true;
  data: ArticleRecord;
}

export interface ArticleListResult {
  data: ArticleRecord[];
  pagination: Pagination;
}

const ARTICLE_LIST_TAG = { type: "Article" as const, id: "LIST" };

function buildFormData(input: ArticleFormInput): FormData {
  const formData = new FormData();
  formData.append("categoryId", String(input.categoryId));
  formData.append("authorId", String(input.authorId));
  formData.append("title", input.title);
  if (input.slug) formData.append("slug", input.slug);
  if (input.excerpt) formData.append("excerpt", input.excerpt);
  formData.append("body", input.body);
  if (input.readTimeMinutes != null) formData.append("readTimeMinutes", String(input.readTimeMinutes));
  formData.append("status", input.status);
  formData.append("isActive", String(input.isActive));
  if (input.scheduledAt) formData.append("scheduledAt", input.scheduledAt);
  if (input.metaTitle) formData.append("metaTitle", input.metaTitle);
  if (input.metaDescription) formData.append("metaDescription", input.metaDescription);
  if (input.metaKeywords) formData.append("metaKeywords", input.metaKeywords);
  formData.append("brandIds", JSON.stringify(input.brandIds));
  formData.append("modelIds", JSON.stringify(input.modelIds));
  if (input.coverImage) formData.append("coverImage", input.coverImage);
  return formData;
}

export const articleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getArticles: builder.query<ArticleListResult, ListArticlesParams | void>({
      query: (params) => ({ url: "/articles", method: "GET", params: params ?? {} }),
      transformResponse: (res: ArticleListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((a) => ({ type: "Article" as const, id: a.id })), ARTICLE_LIST_TAG]
          : [ARTICLE_LIST_TAG],
    }),

    getArticleById: builder.query<ArticleRecord, number>({
      query: (id) => ({ url: `/articles/${id}`, method: "GET" }),
      transformResponse: (res: ArticleSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Article", id }],
    }),

    createArticle: builder.mutation<ArticleRecord, ArticleFormInput>({
      query: (input) => ({ url: "/articles", method: "POST", data: buildFormData(input) }),
      transformResponse: (res: ArticleSingleRawResponse) => res.data,
      invalidatesTags: [ARTICLE_LIST_TAG],
    }),

    updateArticle: builder.mutation<ArticleRecord, { id: number; input: ArticleFormInput }>({
      query: ({ id, input }) => ({ url: `/articles/${id}`, method: "PATCH", data: buildFormData(input) }),
      transformResponse: (res: ArticleSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Article", id }, ARTICLE_LIST_TAG],
    }),

    // Lightweight row-level status change — separate from the full edit
    // mutation, same reasoning as brand.api.ts's updateBrandStatus.
    updateArticleStatus: builder.mutation<
      ArticleRecord,
      { id: number; status: ArticleStatus; scheduledAt?: string | null }
    >({
      query: ({ id, status, scheduledAt }) => ({
        url: `/articles/${id}/status`,
        method: "PATCH",
        data: { status, scheduledAt },
      }),
      transformResponse: (res: ArticleSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Article", id }, ARTICLE_LIST_TAG],
    }),

    deleteArticle: builder.mutation<void, number>({
      query: (id) => ({ url: `/articles/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Article", id }, ARTICLE_LIST_TAG],
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetArticleByIdQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useUpdateArticleStatusMutation,
  useDeleteArticleMutation,
} = articleApi;