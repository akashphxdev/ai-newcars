// src/pages/Roles/role.api.ts
import { api } from "../../../store/baseApi";

export interface RoleRecord {
  id: number;
  roleName: string;
  parentRoleId: number | null;
  permissionIds: number[] | null;
  createdAt: string;
  parentRole: { id: number; roleName: string } | null;
}

export interface ListRolesResponse {
  all: RoleRecord[];
  parentRoles: RoleRecord[];
  childRolesByParent: Record<string, RoleRecord[]>;
}

export interface CreateRoleInput {
  roleName: string;
  parentRoleId?: number;
  permissionIds: number[];
}

export interface UpdateRoleInput {
  roleName?: string;
  permissionIds?: number[];
}

interface RoleListRawResponse {
  success: true;
  data: ListRolesResponse;
}

interface RoleSingleRawResponse {
  success: true;
  data: RoleRecord;
}

const ROLE_LIST_TAG = { type: "Role" as const, id: "LIST" };

export const roleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<ListRolesResponse, void>({
      query: () => ({ url: "/admin-users/roles", method: "GET" }),
      transformResponse: (res: RoleListRawResponse) => res.data,
      providesTags: (result) =>
        result
          ? [...result.all.map((r) => ({ type: "Role" as const, id: r.id })), ROLE_LIST_TAG]
          : [ROLE_LIST_TAG],
    }),

    getRoleById: builder.query<RoleRecord, number>({
      query: (id) => ({ url: `/admin-users/roles/${id}`, method: "GET" }),
      transformResponse: (res: RoleSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Role", id }],
    }),

    createRole: builder.mutation<RoleRecord, CreateRoleInput>({
      query: (body) => ({ url: "/admin-users/roles", method: "POST", data: body }),
      transformResponse: (res: RoleSingleRawResponse) => res.data,
      invalidatesTags: [ROLE_LIST_TAG],
    }),

    updateRole: builder.mutation<RoleRecord, { id: number; input: UpdateRoleInput }>({
      query: ({ id, input }) => ({ url: `/admin-users/roles/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: RoleSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Role", id }, ROLE_LIST_TAG],
    }),

    deleteRole: builder.mutation<void, number>({
      query: (id) => ({ url: `/admin-users/roles/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Role", id }, ROLE_LIST_TAG],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;