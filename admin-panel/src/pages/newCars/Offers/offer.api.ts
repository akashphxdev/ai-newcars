// src/pages/newCars/Offers/offer.api.ts
import { api } from "../../../store/baseApi";

export interface OfferRecord {
  id: number;
  modelId: number;
  variantId: number | null;
  cityId: number | null;
  // Numeric code — resolve to a label via ../../../lib/lookups's
  // getOfferTypeLabel().
  offerType: number | null;
  // Decimal field comes back from Prisma serialized as a string — same
  // convention as VariantRecord's price.
  offerAmount: string | null;
  description: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  imageUrl: string;
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

// modelId and image are the only mandatory fields on create —
// everything else mirrors the schema's own nullability. Full replace on
// edit too (same convention as FaqFormInput / VariantFormInput), except
// the image, which has its own dedicated upload mutation below (same
// split as Brand's logo).
export interface OfferFormInput {
  modelId: number;
  variantId: number | null;
  cityId: number | null;
  offerType: number | null;
  offerAmount: number | null;
  description: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
}

export interface CreateOfferInput extends OfferFormInput {
  // Required on create — same as CreateBrandInput's logo.
  image: File;
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

    // Multipart — image rides along with the rest of the form, same
    // shape as brand.api.ts's createBrand.
    createOffer: builder.mutation<OfferRecord, CreateOfferInput>({
      query: ({ image, ...fields }) => {
        const formData = new FormData();
        formData.append("modelId", String(fields.modelId));
        if (fields.variantId != null) formData.append("variantId", String(fields.variantId));
        if (fields.cityId != null) formData.append("cityId", String(fields.cityId));
        if (fields.offerType != null) formData.append("offerType", String(fields.offerType));
        if (fields.offerAmount != null) formData.append("offerAmount", String(fields.offerAmount));
        if (fields.description) formData.append("description", fields.description);
        if (fields.validFrom) formData.append("validFrom", fields.validFrom);
        if (fields.validUntil) formData.append("validUntil", fields.validUntil);
        formData.append("isActive", String(fields.isActive));
        formData.append("image", image);
        return { url: "/new-cars/offers", method: "POST", data: formData };
      },
      transformResponse: (res: OfferSingleRawResponse) => res.data,
      invalidatesTags: [OFFER_LIST_TAG],
    }),

    updateOffer: builder.mutation<OfferRecord, { id: number; input: OfferFormInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/offers/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: OfferSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Offer", id }, OFFER_LIST_TAG],
    }),

    // Lightweight row-level Active/Inactive toggle — separate from the
    // full edit mutation so flipping the switch doesn't need the whole
    // edit form's payload. Same pattern as brand.api.ts's
    // updateBrandStatus.
    updateOfferStatus: builder.mutation<OfferRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/new-cars/offers/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: OfferSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Offer", id }, OFFER_LIST_TAG],
    }),

    uploadOfferImage: builder.mutation<{ id: number; imageUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return { url: `/new-cars/offers/${id}/image`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; imageUrl: string } }) => res.data,
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
  useUpdateOfferStatusMutation,
  useUploadOfferImageMutation,
  useDeleteOfferMutation,
} = offerApi;