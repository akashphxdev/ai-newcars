// src/pages/newCars/ColorsImages/colorImage.api.ts
import { api } from "../../../store/baseApi";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListModelsWithColorsOrImagesParams {
  page?: number;
  limit?: number;
  search?: string;
}

// A model only appears here once it has at least one color or image —
// brand-new models are picked via "Add to new model" instead.
export interface ModelWithColorsOrImagesRecord {
  id: number;
  name: string;
  brand: { id: number; name: string };
  colorsCount: number;
  imagesCount: number;
}

export interface ModelsWithColorsOrImagesListResult {
  data: ModelWithColorsOrImagesRecord[];
  pagination: Pagination;
}

interface ModelsWithColorsOrImagesRawResponse {
  success: true;
  data: ModelWithColorsOrImagesRecord[];
  pagination: Pagination;
}

export const colorImageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Re-uses CarColor/CarImage's own LIST tags (not a new tag type) —
    // any color or image mutation already invalidates those, so this
    // listing refreshes for free whenever either changes.
    getModelsWithColorsOrImages: builder.query<
      ModelsWithColorsOrImagesListResult,
      ListModelsWithColorsOrImagesParams | void
    >({
      query: (params) => ({ url: "/new-cars/color-images", method: "GET", params: params ?? {} }),
      transformResponse: (res: ModelsWithColorsOrImagesRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: [
        { type: "CarColor", id: "LIST" },
        { type: "CarImage", id: "LIST" },
      ],
    }),
  }),
});

export const { useGetModelsWithColorsOrImagesQuery } = colorImageApi;
