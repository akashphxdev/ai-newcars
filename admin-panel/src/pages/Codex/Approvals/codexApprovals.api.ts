import { api } from "../../../store/baseApi";

export const CODEX_ENTITIES = [
  { value: "brands", label: "Brands" },
  { value: "car-models", label: "Car Models" },
  { value: "car-variants", label: "Car Variants" },
  { value: "powertrains-ice", label: "ICE Powertrains" },
  { value: "powertrains-electric", label: "Electric Powertrains" },
  { value: "feature-categories", label: "Feature Categories" },
  { value: "features", label: "Features" },
  { value: "variant-features", label: "Variant Features" },
  { value: "car-colors", label: "Car Colors" },
  { value: "car-color-shades", label: "Color Shades" },
  { value: "car-images", label: "Car Images" },
  { value: "articles", label: "Articles" },
  { value: "article-brands", label: "Article Brands" },
  { value: "article-car-models", label: "Article Models" },
  { value: "car-faqs", label: "FAQs" },
] as const;

export type CodexEntity = (typeof CODEX_ENTITIES)[number]["value"];
export type CodexProposalStatus = "pending" | "rejected";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CodexProposalRecord {
  id: number;
  runId?: string | number | null;
  proposalStatus: CodexProposalStatus;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  name?: string;
  slug?: string;
  title?: string;
  variantName?: string;
  question?: string;
  colorName?: string;
  imageUrl?: string;
  value?: string | null;
  status?: string;
  [key: string]: unknown;
}

export interface CodexRunRecord {
  id: string | number;
  taskType: string;
  status: string;
  sourceUrl?: string | null;
  errorMessage?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodexProposalEventRecord {
  id: string | number;
  runId?: string | number | null;
  entityType: string;
  entityId?: number | null;
  action: string;
  message?: string | null;
  payload?: unknown;
  createdAt: string;
}

interface ListRawResponse<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

interface SingleRawResponse<T> {
  success: true;
  data: T;
}

export interface ListCodexProposalsParams {
  entity: CodexEntity;
  page?: number;
  limit?: number;
  status?: CodexProposalStatus;
  search?: string;
  runId?: string | number;
  sortOrder?: "asc" | "desc";
}

export interface ListCodexRunsParams {
  page?: number;
  limit?: number;
  status?: string;
  taskType?: string;
  sortOrder?: "asc" | "desc";
}

export interface CodexListResult<T> {
  data: T[];
  pagination: Pagination;
}

const CODEX_LIST_TAG = { type: "CodexProposal" as const, id: "LIST" };
const CODEX_RUN_LIST_TAG = { type: "CodexRun" as const, id: "LIST" };

export const codexApprovalsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCodexProposals: builder.query<CodexListResult<CodexProposalRecord>, ListCodexProposalsParams>({
      query: ({ entity, ...params }) => ({ url: `/codex/${entity}`, method: "GET", params }),
      transformResponse: (res: ListRawResponse<CodexProposalRecord>) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result, _error, { entity }) =>
        result
          ? [
              ...result.data.map((item) => ({ type: "CodexProposal" as const, id: `${entity}-${item.id}` })),
              CODEX_LIST_TAG,
            ]
          : [CODEX_LIST_TAG],
    }),

    getCodexProposalById: builder.query<CodexProposalRecord, { entity: CodexEntity; id: number }>({
      query: ({ entity, id }) => ({ url: `/codex/${entity}/${id}`, method: "GET" }),
      transformResponse: (res: SingleRawResponse<CodexProposalRecord>) => res.data,
      providesTags: (_result, _error, { entity, id }) => [{ type: "CodexProposal", id: `${entity}-${id}` }],
    }),

    approveCodexProposal: builder.mutation<CodexProposalRecord, { entity: CodexEntity; id: number }>({
      query: ({ entity, id }) => ({ url: `/codex/${entity}/${id}/approve`, method: "PATCH" }),
      transformResponse: (res: SingleRawResponse<CodexProposalRecord>) => res.data,
      invalidatesTags: (_result, _error, { entity, id }) => [
        { type: "CodexProposal", id: `${entity}-${id}` },
        CODEX_LIST_TAG,
      ],
    }),

    rejectCodexProposal: builder.mutation<CodexProposalRecord, { entity: CodexEntity; id: number }>({
      query: ({ entity, id }) => ({ url: `/codex/${entity}/${id}/reject`, method: "PATCH" }),
      transformResponse: (res: SingleRawResponse<CodexProposalRecord>) => res.data,
      invalidatesTags: (_result, _error, { entity, id }) => [
        { type: "CodexProposal", id: `${entity}-${id}` },
        CODEX_LIST_TAG,
      ],
    }),

    getCodexRuns: builder.query<CodexListResult<CodexRunRecord>, ListCodexRunsParams | void>({
      query: (params) => ({ url: "/codex/runs", method: "GET", params: params ?? {} }),
      transformResponse: (res: ListRawResponse<CodexRunRecord>) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: [CODEX_RUN_LIST_TAG],
    }),

    getCodexRunEvents: builder.query<CodexProposalEventRecord[], string | number>({
      query: (id) => ({ url: `/codex/runs/${id}/events`, method: "GET" }),
      transformResponse: (res: SingleRawResponse<CodexProposalEventRecord[]>) => res.data,
      providesTags: (_result, _error, id) => [{ type: "CodexRun", id }],
    }),
  }),
});

export const {
  useApproveCodexProposalMutation,
  useGetCodexProposalByIdQuery,
  useGetCodexProposalsQuery,
  useGetCodexRunEventsQuery,
  useGetCodexRunsQuery,
  useRejectCodexProposalMutation,
} = codexApprovalsApi;
