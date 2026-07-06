// src/pages/newCars/Offers/offer.api.ts
import { api } from "../../../store/baseApi";

// Free-text on the DB (VARCHAR(30), no enum) — this list is just the
// suggested set shown in the dropdown, not a hard constraint.
export const OFFER_TYPES = [
  "cash_discount",
  "exchange_bonus",
  "corporate_discount",
  "loyalty_bonus",
  "finance_offer",
  "other",
] as const;

export type OfferTypeValue = (typeof OFFER_TYPES)[number];

export interface OfferRecord {
  id: number;
  modelId: number;
  variantId: number | null;
  cityId: number | null;
  offerType: string | null;
  // Decimal field comes back from Prisma serialized as a string — same
  // convention as VariantRecord's price.
  offerAmount: string | null;
  description: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  model: { id: number; name: string; brand: { id: number; name: string } };
  variant: { id: number; variantName: string } | null;
  city: { id: number; name: string } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListOffersParams {
  page?: number;
  limit?: number;
  search?: string;
  modelId?: number;
  variantId?: number;
  cityId?: number;
  isActive?: boolean;
  sortBy?: "id" | "validFrom" | "validUntil" | "offerAmount";
  sortOrder?: "asc" | "desc";
}

// modelId is the only mandatory field — everything else mirrors the
// schema's own nullability. Full replace on edit too — same
// OfferFormInput shape as create (same convention as FaqFormInput /
// VariantFormInput): the form always submits the complete payload.
export interface OfferFormInput {
  modelId: number;
  variantId: number | null;
  cityId: number | null;
  offerType: string | null;
  offerAmount: number | null;
  description: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
}

interface OfferListRawResponse {
  success: true;
  data: OfferRecord[];
  pagination: Pagination;
}

interface OfferSingleRawResponse {
  success: true;
  data: OfferRecord;
}

export interface OfferListResult {
  data: OfferRecord[];
  pagination: Pagination;
}

const OFFER_LIST_TAG = { type: "Offer" as const, id: "LIST" };

export const offerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query<OfferListResult, ListOffersParams | void>({
      query: (params) => ({ url: "/new-cars/offers", method: "GET", params: params ?? {} }),
      transformResponse: (res: OfferListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((o) => ({ type: "Offer" as const, id: o.id })), OFFER_LIST_TAG]
          : [OFFER_LIST_TAG],
    }),

    getOfferById: builder.query<OfferRecord, number>({
      query: (id) => ({ url: `/new-cars/offers/${id}`, method: "GET" }),
      transformResponse: (res: OfferSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Offer", id }],
    }),

    createOffer: builder.mutation<OfferRecord, OfferFormInput>({
      query: (body) => ({ url: "/new-cars/offers", method: "POST", data: body }),
      transformResponse: (res: OfferSingleRawResponse) => res.data,
      invalidatesTags: [OFFER_LIST_TAG],
    }),

    updateOffer: builder.mutation<OfferRecord, { id: number; input: OfferFormInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/offers/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: OfferSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Offer", id }, OFFER_LIST_TAG],
    }),

    deleteOffer: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/offers/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Offer", id }, OFFER_LIST_TAG],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetOfferByIdQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} = offerApi;