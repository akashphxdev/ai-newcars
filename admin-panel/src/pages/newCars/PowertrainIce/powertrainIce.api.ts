// src/pages/newCars/PowertrainIce/powertrainIce.api.ts
import { api } from "../../../store/baseApi";

// Numeric code — see FUEL_TYPE_OPTIONS in lib/lookups.ts for the
// label mapping. Mirrors FUEL_TYPE_CODES in the backend.
export type FuelType = 1 | 2 | 3 | 4 | 5;

export interface AttributeOptionSummary {
  id: number;
  name: string;
  slug: string;
}

export interface PowertrainIceVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface PowertrainIceRecord {
  id: number;
  variantId: number;
  fuelType: FuelType;
  fuelTypeSubCategory: string | null;
  fuelTankCapacity: string | null;
  cngTankCapacity: string | null;
  kerbWeight: number | null;
  engineDisplacement: string | null;
  cubicCapacity: number | null;
  cylinders: number | null;
  cylinderCapacity: string | null;
  transmissionTypeId: number | null;
  transmissionType: AttributeOptionSummary | null;
  transmissionSubType: string | null;
  transmissionSpeed: number | null;
  numGears: number | null;
  isFourByFour: boolean;
  drivetrainId: number | null;
  drivetrain: AttributeOptionSummary | null;
  powerPs: number | null;
  powerMinRpm: number | null;
  powerMaxRpm: number | null;
  powerWeight: string | null;
  torqueNm: number | null;
  torqueMinRpm: number | null;
  torqueMaxRpm: number | null;
  torqueWeight: string | null;
  claimedFe: string | null;
  realWorldMileage: string | null;
  cityMileage: string | null;
  highwayMileage: string | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  realWorldUrl: string | null;
  cityUrl: string | null;
  highwayUrl: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  deletedBy: number | null;
  deletedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  variant: PowertrainIceVariantSummary;
}

// What GET /new-cars/powertrains/ice (listing) actually returns — just the
// table-visible fields. Full spec sheet comes from getPowertrainIceById,
// fetched on demand when a row is expanded.
export interface PowertrainIceListItem {
  id: number;
  variantId: number;
  fuelType: FuelType;
  fuelTypeSubCategory: string | null;
  engineDisplacement: string | null;
  powerPs: number | null;
  torqueNm: number | null;
  transmissionType: AttributeOptionSummary | null;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  variant: PowertrainIceVariantSummary;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListPowertrainIceParams {
  page?: number;
  limit?: number;
  variantId?: number;
  fuelType?: FuelType;
  isDefault?: boolean;
  includeDeleted?: boolean;
  sortBy?: "id" | "createdAt" | "powerPs" | "claimedFe";
  sortOrder?: "asc" | "desc";
}

export interface PowertrainIceFormInput {
  variantId: number;
  fuelType: FuelType;
  fuelTypeSubCategory?: string | null;
  fuelTankCapacity?: number | null;
  cngTankCapacity?: number | null;
  kerbWeight?: number | null;
  engineDisplacement?: number | null;
  cubicCapacity?: number | null;
  cylinders?: number | null;
  cylinderCapacity?: number | null;
  transmissionTypeId?: number | null;
  transmissionSubType?: string | null;
  transmissionSpeed?: number | null;
  numGears?: number | null;
  isFourByFour?: boolean;
  drivetrainId?: number | null;
  powerPs?: number | null;
  powerMinRpm?: number | null;
  powerMaxRpm?: number | null;
  powerWeight?: number | null;
  torqueNm?: number | null;
  torqueMinRpm?: number | null;
  torqueMaxRpm?: number | null;
  torqueWeight?: number | null;
  claimedFe?: number | null;
  realWorldMileage?: number | null;
  cityMileage?: number | null;
  highwayMileage?: number | null;
  topSpeedKmph?: number | null;
  topSpeedTimeSec?: number | null;
  realWorldUrl?: string | null;
  cityUrl?: string | null;
  highwayUrl?: string | null;
  isDefault?: boolean;
}

interface PowertrainIceListRawResponse {
  success: true;
  data: PowertrainIceListItem[];
  pagination: Pagination;
}

interface PowertrainIceSingleRawResponse {
  success: true;
  data: PowertrainIceRecord;
}

export interface PowertrainIceListResult {
  data: PowertrainIceListItem[];
  pagination: Pagination;
}

const POWERTRAIN_ICE_LIST_TAG = { type: "PowertrainIce" as const, id: "LIST" };

export const powertrainIceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPowertrainIceList: builder.query<PowertrainIceListResult, ListPowertrainIceParams | void>({
      query: (params) => ({ url: "/new-cars/powertrains/ice", method: "GET", params: params ?? {} }),
      transformResponse: (res: PowertrainIceListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((p) => ({ type: "PowertrainIce" as const, id: p.id })), POWERTRAIN_ICE_LIST_TAG]
          : [POWERTRAIN_ICE_LIST_TAG],
    }),

    getPowertrainIceById: builder.query<PowertrainIceRecord, number>({
      query: (id) => ({ url: `/new-cars/powertrains/ice/${id}`, method: "GET" }),
      transformResponse: (res: PowertrainIceSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "PowertrainIce", id }],
    }),

    createPowertrainIce: builder.mutation<PowertrainIceRecord, PowertrainIceFormInput>({
      query: (body) => ({ url: "/new-cars/powertrains/ice", method: "POST", data: body }),
      transformResponse: (res: PowertrainIceSingleRawResponse) => res.data,
      invalidatesTags: [POWERTRAIN_ICE_LIST_TAG],
    }),

    updatePowertrainIce: builder.mutation<PowertrainIceRecord, { id: number; input: Partial<PowertrainIceFormInput> }>({
        query: ({ id, input }) => ({ url: `/new-cars/powertrains/ice/${id}`, method: "PATCH", data: input }),
        transformResponse: (res: PowertrainIceSingleRawResponse) => res.data,
        invalidatesTags: (_result, _error, { id }) => [{ type: "PowertrainIce", id }, POWERTRAIN_ICE_LIST_TAG],
      }),

    restorePowertrainIce: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/powertrains/ice/${id}/restore`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [{ type: "PowertrainIce", id }, POWERTRAIN_ICE_LIST_TAG],
    }),

    deletePowertrainIce: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/powertrains/ice/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "PowertrainIce", id }, POWERTRAIN_ICE_LIST_TAG],
    }),
  }),
});

export const {
  useGetPowertrainIceListQuery,
  useGetPowertrainIceByIdQuery,
  useCreatePowertrainIceMutation,
  useUpdatePowertrainIceMutation,
  useRestorePowertrainIceMutation,
  useDeletePowertrainIceMutation,
} = powertrainIceApi;