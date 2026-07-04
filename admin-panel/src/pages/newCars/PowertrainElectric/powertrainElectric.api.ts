// src/pages/newCars/PowertrainElectric/powertrainElectric.api.ts
import { api } from "../../../store/baseApi";

export type ElectricDrivetrain = "FWD" | "RWD" | "AWD" | "4WD";
export type TestCycleType = "ARAI" | "WLTP" | "EPA" | "NEDC";

export interface PowertrainElectricVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface PowertrainElectricRecord {
  id: number;
  variantId: number;
  numMotors: number | null;
  motorType: string | null;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention as PowertrainIceRecord.
  batteryCapacity: string | null;
  batteryChemistry: string | null;
  thermalManagementSystem: string | null;
  drivetrain: ElectricDrivetrain | null;
  powerPs: number | null;
  torqueNm: number | null;
  claimedRange: number | null;
  realWorldRange: number | null;
  testCycleType: TestCycleType | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  acChargingOutput: string | null;
  acChargingTime: string | null;
  chargerSizeAc3kwHours: number | null;
  chargerSizeAc7kwHours: number | null;
  chargerSizeAc11kwHours: number | null;
  chargerSizeAc22kwHours: number | null;
  dcChargingOutput: string | null;
  dcFastChargingTime: string | null;
  powertrainBootspace: number | null;
  batteryWarrantyKm: number | null;
  batteryWarrantyYears: number | null;
  motorWarrantyKm: number | null;
  motorWarrantyYears: number | null;
  standardWarrantyKm: string | null;
  standardWarrantyYears: number | null;
  realWorldUrl: string | null;
  cityUrl: string | null;
  highwayUrl: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  deletedBy: number | null;
  deletedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  variant: PowertrainElectricVariantSummary;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListPowertrainElectricParams {
  page?: number;
  limit?: number;
  variantId?: number;
  isDefault?: boolean;
  includeDeleted?: boolean;
  sortBy?: "id" | "createdAt" | "claimedRange" | "powerPs";
  sortOrder?: "asc" | "desc";
}

// Only variantId is mandatory — every other spec field is optional and
// filled in progressively, same reasoning as PowertrainIceFormInput.
export interface PowertrainElectricFormInput {
  variantId: number;
  numMotors?: number | null;
  motorType?: string | null;
  batteryCapacity?: number | null;
  batteryChemistry?: string | null;
  thermalManagementSystem?: string | null;
  drivetrain?: ElectricDrivetrain | null;
  powerPs?: number | null;
  torqueNm?: number | null;
  claimedRange?: number | null;
  realWorldRange?: number | null;
  testCycleType?: TestCycleType | null;
  topSpeedKmph?: number | null;
  topSpeedTimeSec?: number | null;
  acChargingOutput?: number | null;
  acChargingTime?: number | null;
  chargerSizeAc3kwHours?: number | null;
  chargerSizeAc7kwHours?: number | null;
  chargerSizeAc11kwHours?: number | null;
  chargerSizeAc22kwHours?: number | null;
  dcChargingOutput?: number | null;
  dcFastChargingTime?: string | null;
  powertrainBootspace?: number | null;
  batteryWarrantyKm?: number | null;
  batteryWarrantyYears?: number | null;
  motorWarrantyKm?: number | null;
  motorWarrantyYears?: number | null;
  standardWarrantyKm?: string | null;
  standardWarrantyYears?: number | null;
  realWorldUrl?: string | null;
  cityUrl?: string | null;
  highwayUrl?: string | null;
  isDefault?: boolean;
}

interface PowertrainElectricListRawResponse {
  success: true;
  data: PowertrainElectricRecord[];
  pagination: Pagination;
}

interface PowertrainElectricSingleRawResponse {
  success: true;
  data: PowertrainElectricRecord;
}

export interface PowertrainElectricListResult {
  data: PowertrainElectricRecord[];
  pagination: Pagination;
}

const POWERTRAIN_ELECTRIC_LIST_TAG = { type: "PowertrainElectric" as const, id: "LIST" };

export const powertrainElectricApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPowertrainElectricList: builder.query<PowertrainElectricListResult, ListPowertrainElectricParams | void>({
      query: (params) => ({ url: "/new-cars/powertrains/electric", method: "GET", params: params ?? {} }),
      transformResponse: (res: PowertrainElectricListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: "PowertrainElectric" as const, id: p.id })),
              POWERTRAIN_ELECTRIC_LIST_TAG,
            ]
          : [POWERTRAIN_ELECTRIC_LIST_TAG],
    }),

    getPowertrainElectricById: builder.query<PowertrainElectricRecord, number>({
      query: (id) => ({ url: `/new-cars/powertrains/electric/${id}`, method: "GET" }),
      transformResponse: (res: PowertrainElectricSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "PowertrainElectric", id }],
    }),

    createPowertrainElectric: builder.mutation<PowertrainElectricRecord, PowertrainElectricFormInput>({
      query: (body) => ({ url: "/new-cars/powertrains/electric", method: "POST", data: body }),
      transformResponse: (res: PowertrainElectricSingleRawResponse) => res.data,
      invalidatesTags: [POWERTRAIN_ELECTRIC_LIST_TAG],
    }),

    // Partial update — only the fields present in `input` are sent.
    updatePowertrainElectric: builder.mutation<
      PowertrainElectricRecord,
      { id: number; input: Partial<PowertrainElectricFormInput> }
    >({
      query: ({ id, input }) => ({
        url: `/new-cars/powertrains/electric/${id}`,
        method: "PATCH",
        data: input,
      }),
      transformResponse: (res: PowertrainElectricSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "PowertrainElectric", id },
        POWERTRAIN_ELECTRIC_LIST_TAG,
      ],
    }),

    restorePowertrainElectric: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/powertrains/electric/${id}/restore`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "PowertrainElectric", id },
        POWERTRAIN_ELECTRIC_LIST_TAG,
      ],
    }),

    deletePowertrainElectric: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/powertrains/electric/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "PowertrainElectric", id },
        POWERTRAIN_ELECTRIC_LIST_TAG,
      ],
    }),
  }),
});

export const {
  useGetPowertrainElectricListQuery,
  useGetPowertrainElectricByIdQuery,
  useCreatePowertrainElectricMutation,
  useUpdatePowertrainElectricMutation,
  useRestorePowertrainElectricMutation,
  useDeletePowertrainElectricMutation,
} = powertrainElectricApi;