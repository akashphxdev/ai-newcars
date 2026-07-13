// src/pages/Articles/ArticleComments/articleComment.api.ts
//
// RTK Query version, same pattern as offer.api.ts's status field.

import { api } from "../../../store/baseApi";

export type CommentStatus = "visible" | "hidden" | "flagged";

export interface ArticleCommentRecord {
  id: number;
  articleId: number;
  article: { id: number; title: string; slug: string };
  userId: number;
  user: { id: number; name: string };
  parentCommentId: number | null;
  body: string;
  status: CommentStatus;
  createdAt: string;
  replyCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListArticleCommentsParams {
  page?: number;
  limit?: number;
  search?: string;
  articleId?: number;
  status?: CommentStatus;
  sortBy?: "id" | "createdAt";
  sortOrder?: "asc" | "desc";
}

interface ArticleCommentListRawResponse {
  success: true;
  data: ArticleCommentRecord[];
  pagination: Pagination;
}

interface ArticleCommentSingleRawResponse {
  success: true;
  data: ArticleCommentRecord;
}

export interface ArticleCommentListResult {
  data: ArticleCommentRecord[];
  pagination: Pagination;
}

const ARTICLE_COMMENT_LIST_TAG = { type: "ArticleComment" as const, id: "LIST" };

export const articleCommentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getArticleComments: builder.query<ArticleCommentListResult, ListArticleCommentsParams | void>({
      query: (params) => ({ url: "/articles/comments", method: "GET", params: params ?? {} }),
      transformResponse: (res: ArticleCommentListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((c) => ({ type: "ArticleComment" as const, id: c.id })), ARTICLE_COMMENT_LIST_TAG]
          : [ARTICLE_COMMENT_LIST_TAG],
    }),

    updateArticleCommentStatus: builder.mutation<ArticleCommentRecord, { id: number; status: CommentStatus }>({
      query: ({ id, status }) => ({ url: `/articles/comments/${id}/status`, method: "PATCH", data: { status } }),
      transformResponse: (res: ArticleCommentSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "ArticleComment", id }, ARTICLE_COMMENT_LIST_TAG],
    }),

    deleteArticleComment: builder.mutation<void, number>({
      query: (id) => ({ url: `/articles/comments/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "ArticleComment", id }, ARTICLE_COMMENT_LIST_TAG],
    }),
  }),
});

export const {
  useGetArticleCommentsQuery,
  useUpdateArticleCommentStatusMutation,
  useDeleteArticleCommentMutation,
} = articleCommentApi;