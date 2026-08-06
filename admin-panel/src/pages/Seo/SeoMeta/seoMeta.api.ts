// src/pages/Seo/SeoMeta/seoMeta.api.ts
//
// RTK Query version, same pattern as placement.api.ts / articleCategory.api.ts.
// pageType is a numeric code — see SEO_PAGE_TYPE_OPTIONS in lib/lookups.ts
// for the code -> label mapping (mirrors the backend's SEO_PAGE_TYPE_CODES
// in seoMeta.validation.ts).
//
// Structured-data fields (vehicleSchema/faqSchema/reviewSchema/articleSchema/
// authorSchema/breadcrumbSchema) hold raw JSON-LD strings, one per
// schema.org type. This used to live in a separate SchemaTemplate table —
// now folded directly into SeoMeta so one row = one page's complete SEO
// package (meta + structured data), editable from a single form.

import { api } from "../../../store/baseApi";

export interface SeoMetaRecord {
  id: number;
  pageType: number;
  entityId: number | null;
  staticPageSlug: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  h1Tag: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robotsMeta: string | null;
  vehicleSchema: string | null;
  faqSchema: string | null;
  reviewSchema: string | null;
  articleSchema: string | null;
  authorSchema: string | null;
  breadcrumbSchema: string | null;
  status: boolean;
  createdBy: number | null;
  createdByAdmin: { id: number; name: string } | null;
  createdAt: string;
  updatedBy: number | null;
  updatedByAdmin: { id: number; name: string } | null;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListSeoMetasParams {
  page?: number;
  limit?: number;
  search?: string;
  pageType?: number;
  entityId?: number;
  status?: boolean;
  sortBy?: "id" | "pageType" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface SeoMetaInput {
  pageType: number;
  entityId: number | null;
  staticPageSlug?: string | null;
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  h1Tag?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  robotsMeta?: string | null;
  vehicleSchema?: string | null;
  faqSchema?: string | null;
  reviewSchema?: string | null;
  articleSchema?: string | null;
  authorSchema?: string | null;
  breadcrumbSchema?: string | null;
  status: boolean;
}

interface SeoMetaListRawResponse {
  success: true;
  data: SeoMetaRecord[];
  pagination: Pagination;
}

interface SeoMetaSingleRawResponse {
  success: true;
  data: SeoMetaRecord;
}

export interface SeoMetaListResult {
  data: SeoMetaRecord[];
  pagination: Pagination;
}

const SEO_META_LIST_TAG = { type: "SeoMeta" as const, id: "LIST" };

export const seoMetaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSeoMetas: builder.query<SeoMetaListResult, ListSeoMetasParams | void>({
      query: (params) => ({ url: "/seo/meta", method: "GET", params: params ?? {} }),
      transformResponse: (res: SeoMetaListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((m) => ({ type: "SeoMeta" as const, id: m.id })), SEO_META_LIST_TAG]
          : [SEO_META_LIST_TAG],
    }),

    getSeoMetaById: builder.query<SeoMetaRecord, number>({
      query: (id) => ({ url: `/seo/meta/${id}`, method: "GET" }),
      transformResponse: (res: SeoMetaSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "SeoMeta", id }],
    }),

    createSeoMeta: builder.mutation<SeoMetaRecord, SeoMetaInput>({
      query: (body) => ({ url: "/seo/meta", method: "POST", data: body }),
      transformResponse: (res: SeoMetaSingleRawResponse) => res.data,
      invalidatesTags: [SEO_META_LIST_TAG],
    }),

    updateSeoMeta: builder.mutation<SeoMetaRecord, { id: number; input: SeoMetaInput }>({
      query: ({ id, input }) => ({ url: `/seo/meta/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: SeoMetaSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "SeoMeta", id }, SEO_META_LIST_TAG],
    }),

    updateSeoMetaStatus: builder.mutation<SeoMetaRecord, { id: number; status: boolean }>({
      query: ({ id, status }) => ({ url: `/seo/meta/${id}/status`, method: "PATCH", data: { status } }),
      transformResponse: (res: SeoMetaSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "SeoMeta", id }, SEO_META_LIST_TAG],
    }),

    deleteSeoMeta: builder.mutation<void, number>({
      query: (id) => ({ url: `/seo/meta/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "SeoMeta", id }, SEO_META_LIST_TAG],
    }),
  }),
});

export const {
  useGetSeoMetasQuery,
  useGetSeoMetaByIdQuery,
  useCreateSeoMetaMutation,
  useUpdateSeoMetaMutation,
  useUpdateSeoMetaStatusMutation,
  useDeleteSeoMetaMutation,
} = seoMetaApi;