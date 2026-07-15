// src/pages/Stories/StoryGroups/storyGroup.api.ts
//
// RTK Query version, same pattern as city.api.ts / brand.api.ts.

import { api } from "../../../store/baseApi";

export type MediaType = "image" | "video";

export interface StoryGroupRecord {
  id: number;
  title: string;
  coverMediaType: MediaType;
  coverMediaUrl: string;
  viewCount: number;
  isActive: boolean;
  displayOrder: number;
  createdBy: number | null;
  createdByAdmin: { id: number; name: string } | null;
  createdAt: string;
  updatedBy: number | null;
  updatedByAdmin: { id: number; name: string } | null;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListStoryGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "id" | "title" | "displayOrder" | "viewCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Shared shape for create/update — full-replace on edit too (mirrors the
// backend's createStoryGroupSchema / updateStoryGroupSchema, which are
// identical). coverMediaUrl is only meaningful (and required) when
// coverMediaType is "video" — for "image" the file rides along
// separately (create's `cover` field / the dedicated cover-upload route).
export interface StoryGroupFormInput {
  title: string;
  coverMediaType: MediaType;
  coverMediaUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateStoryGroupInput extends StoryGroupFormInput {
  // Required when coverMediaType is "image" — controller rejects the
  // request without one.
  cover?: File;
}

interface StoryGroupListRawResponse {
  success: true;
  data: StoryGroupRecord[];
  pagination: Pagination;
}

interface StoryGroupSingleRawResponse {
  success: true;
  data: StoryGroupRecord;
}

export interface StoryGroupListResult {
  data: StoryGroupRecord[];
  pagination: Pagination;
}

const STORY_GROUP_LIST_TAG = { type: "StoryGroup" as const, id: "LIST" };

function buildStoryGroupFormData(input: CreateStoryGroupInput): FormData {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("coverMediaType", input.coverMediaType);
  if (input.coverMediaUrl) formData.append("coverMediaUrl", input.coverMediaUrl);
  formData.append("displayOrder", String(input.displayOrder));
  formData.append("isActive", String(input.isActive));
  if (input.cover) formData.append("cover", input.cover);
  return formData;
}

export const storyGroupApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStoryGroups: builder.query<StoryGroupListResult, ListStoryGroupsParams | void>({
      query: (params) => ({ url: "/stories/story-groups", method: "GET", params: params ?? {} }),
      transformResponse: (res: StoryGroupListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((g) => ({ type: "StoryGroup" as const, id: g.id })), STORY_GROUP_LIST_TAG]
          : [STORY_GROUP_LIST_TAG],
    }),

    getStoryGroupById: builder.query<StoryGroupRecord, number>({
      query: (id) => ({ url: `/stories/story-groups/${id}`, method: "GET" }),
      transformResponse: (res: StoryGroupSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "StoryGroup", id }],
    }),

    createStoryGroup: builder.mutation<StoryGroupRecord, CreateStoryGroupInput>({
      query: (input) => ({ url: "/stories/story-groups", method: "POST", data: buildStoryGroupFormData(input) }),
      transformResponse: (res: StoryGroupSingleRawResponse) => res.data,
      invalidatesTags: [STORY_GROUP_LIST_TAG],
    }),

    updateStoryGroup: builder.mutation<StoryGroupRecord, { id: number; input: StoryGroupFormInput }>({
      query: ({ id, input }) => ({ url: `/stories/story-groups/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: StoryGroupSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "StoryGroup", id }, STORY_GROUP_LIST_TAG],
    }),

    // Lightweight row-level Active/Inactive toggle — separate from the
    // full edit mutation, same pattern as brand.api.ts's updateBrandStatus.
    updateStoryGroupStatus: builder.mutation<StoryGroupRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/stories/story-groups/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: StoryGroupSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "StoryGroup", id }, STORY_GROUP_LIST_TAG],
    }),

    uploadStoryGroupCover: builder.mutation<{ id: number; coverMediaUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("cover", file);
        return { url: `/stories/story-groups/${id}/cover`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; coverMediaUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "StoryGroup", id }, STORY_GROUP_LIST_TAG],
    }),

    deleteStoryGroup: builder.mutation<void, number>({
      query: (id) => ({ url: `/stories/story-groups/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "StoryGroup", id }, STORY_GROUP_LIST_TAG],
    }),
  }),
});

export const {
  useGetStoryGroupsQuery,
  useGetStoryGroupByIdQuery,
  useCreateStoryGroupMutation,
  useUpdateStoryGroupMutation,
  useUpdateStoryGroupStatusMutation,
  useUploadStoryGroupCoverMutation,
  useDeleteStoryGroupMutation,
} = storyGroupApi;
