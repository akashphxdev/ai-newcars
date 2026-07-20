// src/pages/Home/Banners/banner.api.ts
import { api } from "../../../store/baseApi";

export interface BannerRecord {
  id: number;
  name: string;
  tagLabel: string;
  heading: string;
  highlightText: string;
  description: string;
  // 1=Image, 2=Video — resolve to a label via ../../../lib/lookups's
  // getBannerMediaTypeLabel().
  mediaType: number;
  imageUrl: string | null;
  videoUrl: string | null;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  isActive: boolean;
  clickCount: number;
  createdBy: number;
  createdByAdmin: { id: number; name: string };
  updatedBy: number | null;
  updatedByAdmin: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListBannersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "id" | "displayOrder" | "clickCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Media is required on create — same "own dedicated upload mutation"
// split as OfferFormInput's image.
export interface BannerFormInput {
  name: string;
  tagLabel: string;
  heading: string;
  highlightText: string;
  description: string;
  mediaType: number;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateBannerInput extends BannerFormInput {
  media: File;
}

interface BannerListRawResponse {
  success: true;
  data: BannerRecord[];
  pagination: Pagination;
}

interface BannerSingleRawResponse {
  success: true;
  data: BannerRecord;
}

export interface BannerListResult {
  data: BannerRecord[];
  pagination: Pagination;
}

const BANNER_LIST_TAG = { type: "Banner" as const, id: "LIST" };

export const bannerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBanners: builder.query<BannerListResult, ListBannersParams | void>({
      query: (params) => ({ url: "/home/banners", method: "GET", params: params ?? {} }),
      transformResponse: (res: BannerListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((b) => ({ type: "Banner" as const, id: b.id })), BANNER_LIST_TAG]
          : [BANNER_LIST_TAG],
    }),

    getBannerById: builder.query<BannerRecord, number>({
      query: (id) => ({ url: `/home/banners/${id}`, method: "GET" }),
      transformResponse: (res: BannerSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Banner", id }],
    }),

    // Multipart — media rides along with the rest of the form, same
    // shape as offer.api.ts's createOffer.
    createBanner: builder.mutation<BannerRecord, CreateBannerInput>({
      query: ({ media, ...fields }) => {
        const formData = new FormData();
        formData.append("name", fields.name);
        formData.append("tagLabel", fields.tagLabel);
        formData.append("heading", fields.heading);
        formData.append("highlightText", fields.highlightText);
        formData.append("description", fields.description);
        formData.append("mediaType", String(fields.mediaType));
        formData.append("ctaText", fields.ctaText);
        formData.append("ctaLink", fields.ctaLink);
        formData.append("displayOrder", String(fields.displayOrder));
        formData.append("isActive", String(fields.isActive));
        formData.append("media", media);
        return { url: "/home/banners", method: "POST", data: formData };
      },
      transformResponse: (res: BannerSingleRawResponse) => res.data,
      invalidatesTags: [BANNER_LIST_TAG],
    }),

    updateBanner: builder.mutation<BannerRecord, { id: number; input: BannerFormInput }>({
      query: ({ id, input }) => ({ url: `/home/banners/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: BannerSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Banner", id }, BANNER_LIST_TAG],
    }),

    // Lightweight row-level Active/Inactive toggle — same pattern as
    // offer.api.ts's updateOfferStatus.
    updateBannerStatus: builder.mutation<BannerRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/home/banners/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: BannerSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Banner", id }, BANNER_LIST_TAG],
    }),

    uploadBannerMedia: builder.mutation<BannerRecord, { id: number; mediaType: number; file: File }>({
      query: ({ id, mediaType, file }) => {
        const formData = new FormData();
        formData.append("mediaType", String(mediaType));
        formData.append("media", file);
        return { url: `/home/banners/${id}/media`, method: "PATCH", data: formData };
      },
      transformResponse: (res: BannerSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Banner", id }, BANNER_LIST_TAG],
    }),

    deleteBanner: builder.mutation<void, number>({
      query: (id) => ({ url: `/home/banners/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Banner", id }, BANNER_LIST_TAG],
    }),
  }),
});

export const {
  useGetBannersQuery,
  useGetBannerByIdQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useUpdateBannerStatusMutation,
  useUploadBannerMediaMutation,
  useDeleteBannerMutation,
} = bannerApi;
