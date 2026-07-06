// src/pages/newCars/Features/feature.api.ts
import { api } from "../../../store/baseApi";

export interface FeatureVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface FeatureRecord {
  id: number;
  variantId: number;
  airbagsCount: number | null;
  absWithEbd: boolean;
  esc: boolean;
  hillAssist: boolean;
  rearParkingCamera: boolean;
  frontParkingSensors: boolean;
  tpms: boolean;
  isofixMounts: boolean;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention as VariantRecord's price / PowertrainIceRecord's specs.
  ncapRating: string | null;
  sunroof: boolean;
  keylessEntry: boolean;
  pushButtonStart: boolean;
  cruiseControl: boolean;
  climateControl: boolean;
  rearAcVents: boolean;
  autoDimmingMirror: boolean;
  powerWindows: boolean;
  upholsteryType: string | null;
  adjustableSeats: boolean;
  ventilatedSeats: boolean;
  rearArmrest: boolean;
  ledHeadlamps: boolean;
  ledDrls: boolean;
  alloyWheels: boolean;
  roofRails: boolean;
  fogLamps: boolean;
  touchscreenSizeInch: string | null;
  androidAuto: boolean;
  appleCarplay: boolean;
  connectedCarTech: boolean;
  numberOfSpeakers: number | null;
  wirelessCharging: boolean;
  extraFeatures: string | null;
  createdAt: string;
  variant: FeatureVariantSummary;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListFeaturesParams {
  page?: number;
  limit?: number;
  variantId?: number;
  sortBy?: "id" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Only variantId is mandatory — every safety/comfort/tech field is
// optional and filled in progressively, same reasoning as
// PowertrainIceFormInput. Update is a partial patch (subset of this
// shape).
export interface FeatureFormInput {
  variantId: number;
  airbagsCount?: number | null;
  absWithEbd?: boolean;
  esc?: boolean;
  hillAssist?: boolean;
  rearParkingCamera?: boolean;
  frontParkingSensors?: boolean;
  tpms?: boolean;
  isofixMounts?: boolean;
  ncapRating?: number | null;
  sunroof?: boolean;
  keylessEntry?: boolean;
  pushButtonStart?: boolean;
  cruiseControl?: boolean;
  climateControl?: boolean;
  rearAcVents?: boolean;
  autoDimmingMirror?: boolean;
  powerWindows?: boolean;
  upholsteryType?: string | null;
  adjustableSeats?: boolean;
  ventilatedSeats?: boolean;
  rearArmrest?: boolean;
  ledHeadlamps?: boolean;
  ledDrls?: boolean;
  alloyWheels?: boolean;
  roofRails?: boolean;
  fogLamps?: boolean;
  touchscreenSizeInch?: number | null;
  androidAuto?: boolean;
  appleCarplay?: boolean;
  connectedCarTech?: boolean;
  numberOfSpeakers?: number | null;
  wirelessCharging?: boolean;
  extraFeatures?: string | null;
}

interface FeatureListRawResponse {
  success: true;
  data: FeatureRecord[];
  pagination: Pagination;
}

interface FeatureSingleRawResponse {
  success: true;
  data: FeatureRecord;
}

export interface FeatureListResult {
  data: FeatureRecord[];
  pagination: Pagination;
}

const FEATURE_LIST_TAG = { type: "Feature" as const, id: "LIST" };

export const featureApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFeatures: builder.query<FeatureListResult, ListFeaturesParams | void>({
      query: (params) => ({ url: "/new-cars/features", method: "GET", params: params ?? {} }),
      transformResponse: (res: FeatureListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((f) => ({ type: "Feature" as const, id: f.id })), FEATURE_LIST_TAG]
          : [FEATURE_LIST_TAG],
    }),

    getFeatureById: builder.query<FeatureRecord, number>({
      query: (id) => ({ url: `/new-cars/features/${id}`, method: "GET" }),
      transformResponse: (res: FeatureSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Feature", id }],
    }),

    createFeature: builder.mutation<FeatureRecord, FeatureFormInput>({
      query: (body) => ({ url: "/new-cars/features", method: "POST", data: body }),
      transformResponse: (res: FeatureSingleRawResponse) => res.data,
      invalidatesTags: [FEATURE_LIST_TAG],
    }),

    // Partial update — only the fields present in `input` are sent.
    updateFeature: builder.mutation<FeatureRecord, { id: number; input: Partial<FeatureFormInput> }>({
      query: ({ id, input }) => ({ url: `/new-cars/features/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: FeatureSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Feature", id }, FEATURE_LIST_TAG],
    }),

    deleteFeature: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/features/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Feature", id }, FEATURE_LIST_TAG],
    }),
  }),
});

export const {
  useGetFeaturesQuery,
  useGetFeatureByIdQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
} = featureApi;