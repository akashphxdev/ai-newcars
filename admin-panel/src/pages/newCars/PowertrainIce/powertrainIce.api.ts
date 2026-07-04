// src/pages/newCars/PowertrainIce/powertrainIce.api.ts
import { api } from "../../../store/baseApi";

export type FuelType = "petrol" | "diesel" | "cng" | "lpg" | "hybrid";
export type IceTransmissionType = "manual" | "automatic" | "amt" | "cvt" | "dct";
export type Drivetrain = "FWD" | "RWD" | "AWD" | "4WD";

export interface PowertrainIceVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface PowertrainIceRecord {
  id: number;
  variantId: number;
  fuelType: FuelType;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention as VariantRecord's price.
  fuelTypeSubCategory: string | null;
  fuelTankCapacity: string | null;
  cngTankCapacity: string | null;
  kerbWeight: number | null;
  engineDisplacement: string | null;
  cubicCapacity: number | null;
  cylinders: number | null;
  cylinderCapacity: string | null;
  transmissionType: IceTransmissionType | null;
  transmissionSubType: string | null;
  transmissionSpeed: number | null;
  numGears: number | null;
  isFourByFour: boolean;
  drivetrain: Drivetrain | null;
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

// Only variantId + fuelType are mandatory — every other spec field is
// optional and filled in progressively, unlike Variant's "everything
// required" form. Update is a partial patch (subset of this shape).
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
  transmissionType?: IceTransmissionType | null;
  transmissionSubType?: string | null;
  transmissionSpeed?: number | null;
  numGears?: number | null;
  isFourByFour?: boolean;
  drivetrain?: Drivetrain | null;
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
  data: PowertrainIceRecord[];
  pagination: Pagination;
}

interface PowertrainIceSingleRawResponse {
  success: true;
  data: PowertrainIceRecord;
}

export interface PowertrainIceListResult {
  data: PowertrainIceRecord[];
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

    // Partial update — only the fields present in `input` are sent.
    updatePowertrainIce: builder.mutation<
      PowertrainIceRecord,
      { id: number; input: Partial<PowertrainIceFormInput> }
    >({
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