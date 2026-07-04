// src/pages/Permission/permission.api.ts
//
// RTK Query version. Same pattern as admin.api.ts / role.api.ts.

import { api } from "../../../store/baseApi";

export interface PermissionRecord {
  id: number;
  module: string;
  action: string;
  permissionKey: string;
}

export interface ListPermissionsResponse {
  flat: PermissionRecord[];
  grouped: Record<string, PermissionRecord[]>;
}

export interface CreatePermissionInput {
  module: string;
  action: "view" | "create" | "update" | "delete";
}

interface PermissionListRawResponse {
  success: true;
  data: ListPermissionsResponse;
}

interface PermissionSingleRawResponse {
  success: true;
  data: PermissionRecord;
}

const PERMISSION_LIST_TAG = { type: "Permission" as const, id: "LIST" };

export const permissionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Query arg is the optional `module` filter — pass undefined (or call
    // the hook with no argument) to fetch every permission.
    getPermissions: builder.query<ListPermissionsResponse, string | void>({
      query: (module) => ({
        url: "/admin-users/permissions",
        method: "GET",
        params: module ? { module } : undefined,
      }),
      transformResponse: (res: PermissionListRawResponse) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.flat.map((p) => ({ type: "Permission" as const, id: p.id })),
              PERMISSION_LIST_TAG,
            ]
          : [PERMISSION_LIST_TAG],
    }),

    createPermission: builder.mutation<PermissionRecord, CreatePermissionInput>({
      query: (body) => ({ url: "/admin-users/permissions", method: "POST", data: body }),
      transformResponse: (res: PermissionSingleRawResponse) => res.data,
      invalidatesTags: [PERMISSION_LIST_TAG],
    }),

    deletePermission: builder.mutation<void, number>({
      query: (id) => ({ url: `/admin-users/permissions/${id}`, method: "DELETE" }),
      invalidatesTags: [PERMISSION_LIST_TAG],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useDeletePermissionMutation,
} = permissionApi;