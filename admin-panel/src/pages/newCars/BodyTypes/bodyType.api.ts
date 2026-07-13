// src/pages/newCars/BodyTypes/bodyType.api.ts
import { api } from "../../../store/baseApi";

export interface BodyTypeRecord {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListBodyTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateBodyTypeInput {
  name: string;
  slug: string;
  description: string;
  icon: File;
}

export interface UpdateBodyTypeInput {
  name: string;
  // Optional — leave blank to let the backend auto-generate it from name.
  slug?: string;
  description: string;
}

interface BodyTypeListRawResponse {
  success: true;
  data: BodyTypeRecord[];
  pagination: Pagination;
}

interface BodyTypeSingleRawResponse {
  success: true;
  data: BodyTypeRecord;
}

export interface BodyTypeListResult {
  data: BodyTypeRecord[];
  pagination: Pagination;
}

const BODY_TYPE_LIST_TAG = { type: "BodyType" as const, id: "LIST" };

export const bodyTypeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBodyTypes: builder.query<BodyTypeListResult, ListBodyTypesParams | void>({
      query: (params) => ({ url: "/new-cars/body-types", method: "GET", params: params ?? {} }),
      transformResponse: (res: BodyTypeListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((b) => ({ type: "BodyType" as const, id: b.id })), BODY_TYPE_LIST_TAG]
          : [BODY_TYPE_LIST_TAG],
    }),

    getBodyTypeById: builder.query<BodyTypeRecord, number>({
      query: (id) => ({ url: `/new-cars/body-types/${id}`, method: "GET" }),
      transformResponse: (res: BodyTypeSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "BodyType", id }],
    }),

    createBodyType: builder.mutation<BodyTypeRecord, CreateBodyTypeInput>({
      query: ({ icon, ...fields }) => {
        const formData = new FormData();
        formData.append("name", fields.name);
        formData.append("slug", fields.slug);
        formData.append("description", fields.description);
        formData.append("icon", icon);
        return { url: "/new-cars/body-types", method: "POST", data: formData };
      },
      transformResponse: (res: BodyTypeSingleRawResponse) => res.data,
      invalidatesTags: [BODY_TYPE_LIST_TAG],
    }),

    updateBodyType: builder.mutation<BodyTypeRecord, { id: number; input: UpdateBodyTypeInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/body-types/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: BodyTypeSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "BodyType", id }, BODY_TYPE_LIST_TAG],
    }),

    uploadBodyTypeIcon: builder.mutation<{ id: number; iconUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("icon", file);
        return { url: `/new-cars/body-types/${id}/icon`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; iconUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "BodyType", id }, BODY_TYPE_LIST_TAG],
    }),

    deleteBodyType: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/body-types/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "BodyType", id }, BODY_TYPE_LIST_TAG],
    }),
  }),
});

export const {
  useGetBodyTypesQuery,
  useGetBodyTypeByIdQuery,
  useCreateBodyTypeMutation,
  useUpdateBodyTypeMutation,
  useUploadBodyTypeIconMutation,
  useDeleteBodyTypeMutation,
} = bodyTypeApi;