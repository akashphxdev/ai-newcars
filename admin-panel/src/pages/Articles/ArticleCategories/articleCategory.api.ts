// src/pages/Articles/ArticleCategories/articleCategory.api.ts
//
// RTK Query version, same pattern as bodyType.api.ts / country.api.ts.

import { api } from "../../../store/baseApi";

export interface ArticleCategoryRecord {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByAdmin: { id: number; name: string } | null;
  updatedByAdmin: { id: number; name: string } | null;
  // Shown in the list so it's obvious *why* delete might be blocked
  // before the admin even tries — mirrors the backend's protective
  // check (see articleCategory.service.ts's deleteArticleCategory).
  articleCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListArticleCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "id" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateArticleCategoryInput {
  name: string;
  slug?: string;
  isActive?: boolean;
}

export interface UpdateArticleCategoryInput {
  name: string;
  slug?: string;
  isActive: boolean;
}

interface ArticleCategoryListRawResponse {
  success: true;
  data: ArticleCategoryRecord[];
  pagination: Pagination;
}

interface ArticleCategorySingleRawResponse {
  success: true;
  data: ArticleCategoryRecord;
}

export interface ArticleCategoryListResult {
  data: ArticleCategoryRecord[];
  pagination: Pagination;
}

const ARTICLE_CATEGORY_LIST_TAG = { type: "ArticleCategory" as const, id: "LIST" };

export const articleCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getArticleCategories: builder.query<ArticleCategoryListResult, ListArticleCategoriesParams | void>({
      query: (params) => ({ url: "/articles/categories", method: "GET", params: params ?? {} }),
      transformResponse: (res: ArticleCategoryListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((c) => ({ type: "ArticleCategory" as const, id: c.id })),
              ARTICLE_CATEGORY_LIST_TAG,
            ]
          : [ARTICLE_CATEGORY_LIST_TAG],
    }),

    getArticleCategoryById: builder.query<ArticleCategoryRecord, number>({
      query: (id) => ({ url: `/articles/categories/${id}`, method: "GET" }),
      transformResponse: (res: ArticleCategorySingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "ArticleCategory", id }],
    }),

    createArticleCategory: builder.mutation<ArticleCategoryRecord, CreateArticleCategoryInput>({
      query: (input) => ({ url: "/articles/categories", method: "POST", data: input }),
      transformResponse: (res: ArticleCategorySingleRawResponse) => res.data,
      invalidatesTags: [ARTICLE_CATEGORY_LIST_TAG],
    }),

    updateArticleCategory: builder.mutation<
      ArticleCategoryRecord,
      { id: number; input: UpdateArticleCategoryInput }
    >({
      query: ({ id, input }) => ({ url: `/articles/categories/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: ArticleCategorySingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "ArticleCategory", id }, ARTICLE_CATEGORY_LIST_TAG],
    }),

    // Lightweight row-level status change — separate from the full edit
    // mutation, same reasoning as brand.api.ts's updateBrandStatus.
    updateArticleCategoryStatus: builder.mutation<ArticleCategoryRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/articles/categories/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: ArticleCategorySingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "ArticleCategory", id }, ARTICLE_CATEGORY_LIST_TAG],
    }),

    deleteArticleCategory: builder.mutation<void, number>({
      query: (id) => ({ url: `/articles/categories/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "ArticleCategory", id }, ARTICLE_CATEGORY_LIST_TAG],
    }),
  }),
});

export const {
  useGetArticleCategoriesQuery,
  useGetArticleCategoryByIdQuery,
  useCreateArticleCategoryMutation,
  useUpdateArticleCategoryMutation,
  useUpdateArticleCategoryStatusMutation,
  useDeleteArticleCategoryMutation,
} = articleCategoryApi;