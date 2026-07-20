// src/pages/Home/Testimonials/testimonial.api.ts
import { api } from "../../../store/baseApi";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface TestimonialRecord {
  id: number;
  userId: number | null;
  user: { id: number; name: string } | null;
  customerName: string;
  customerCity: string | null;
  photoUrl: string | null;
  // Decimal field comes back from Prisma serialized as a string — same
  // convention as OfferRecord's offerAmount.
  rating: string | null;
  quote: string;
  status: TestimonialStatus;
  rejectedReason: string | null;
  reviewedBy: number | null;
  reviewedByAdmin: { id: number; name: string } | null;
  reviewedAt: string | null;
  displayOrder: number;
  isActive: boolean;
  createdBy: number | null;
  createdByAdmin: { id: number; name: string } | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListTestimonialsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TestimonialStatus;
  isActive?: boolean;
  sortBy?: "id" | "displayOrder" | "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Photo is optional — same "own dedicated upload mutation" split as
// OfferFormInput's image, except a testimonial can be saved with no
// photo at all.
export interface TestimonialFormInput {
  userId: number | null;
  customerName: string;
  customerCity: string | null;
  rating: number | null;
  quote: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateTestimonialInput extends TestimonialFormInput {
  photo: File | null;
}

interface TestimonialListRawResponse {
  success: true;
  data: TestimonialRecord[];
  pagination: Pagination;
}

interface TestimonialSingleRawResponse {
  success: true;
  data: TestimonialRecord;
}

export interface TestimonialListResult {
  data: TestimonialRecord[];
  pagination: Pagination;
}

const TESTIMONIAL_LIST_TAG = { type: "Testimonial" as const, id: "LIST" };

export const testimonialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTestimonials: builder.query<TestimonialListResult, ListTestimonialsParams | void>({
      query: (params) => ({ url: "/home/testimonials", method: "GET", params: params ?? {} }),
      transformResponse: (res: TestimonialListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((t) => ({ type: "Testimonial" as const, id: t.id })), TESTIMONIAL_LIST_TAG]
          : [TESTIMONIAL_LIST_TAG],
    }),

    getTestimonialById: builder.query<TestimonialRecord, number>({
      query: (id) => ({ url: `/home/testimonials/${id}`, method: "GET" }),
      transformResponse: (res: TestimonialSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Testimonial", id }],
    }),

    // Multipart — photo rides along with the rest of the form when
    // present, same shape as offer.api.ts's createOffer.
    createTestimonial: builder.mutation<TestimonialRecord, CreateTestimonialInput>({
      query: ({ photo, ...fields }) => {
        const formData = new FormData();
        if (fields.userId != null) formData.append("userId", String(fields.userId));
        formData.append("customerName", fields.customerName);
        if (fields.customerCity) formData.append("customerCity", fields.customerCity);
        if (fields.rating != null) formData.append("rating", String(fields.rating));
        formData.append("quote", fields.quote);
        formData.append("displayOrder", String(fields.displayOrder));
        formData.append("isActive", String(fields.isActive));
        if (photo) formData.append("photo", photo);
        return { url: "/home/testimonials", method: "POST", data: formData };
      },
      transformResponse: (res: TestimonialSingleRawResponse) => res.data,
      invalidatesTags: [TESTIMONIAL_LIST_TAG],
    }),

    updateTestimonial: builder.mutation<TestimonialRecord, { id: number; input: TestimonialFormInput }>({
      query: ({ id, input }) => ({ url: `/home/testimonials/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: TestimonialSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Testimonial", id }, TESTIMONIAL_LIST_TAG],
    }),

    // Moderation route — approve/reject from the review queue.
    updateTestimonialStatus: builder.mutation<
      TestimonialRecord,
      { id: number; status: TestimonialStatus; rejectedReason?: string | null }
    >({
      query: ({ id, status, rejectedReason }) => ({
        url: `/home/testimonials/${id}/status`,
        method: "PATCH",
        data: { status, rejectedReason: rejectedReason ?? null },
      }),
      transformResponse: (res: TestimonialSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Testimonial", id }, TESTIMONIAL_LIST_TAG],
    }),

    // Lightweight row-level Active/Inactive toggle — same pattern as
    // offer.api.ts's updateOfferStatus.
    updateTestimonialActive: builder.mutation<TestimonialRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/home/testimonials/${id}/active`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: TestimonialSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Testimonial", id }, TESTIMONIAL_LIST_TAG],
    }),

    uploadTestimonialPhoto: builder.mutation<{ id: number; photoUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("photo", file);
        return { url: `/home/testimonials/${id}/photo`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; photoUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Testimonial", id }, TESTIMONIAL_LIST_TAG],
    }),

    deleteTestimonial: builder.mutation<void, number>({
      query: (id) => ({ url: `/home/testimonials/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Testimonial", id }, TESTIMONIAL_LIST_TAG],
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useGetTestimonialByIdQuery,
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
  useUpdateTestimonialStatusMutation,
  useUpdateTestimonialActiveMutation,
  useUploadTestimonialPhotoMutation,
  useDeleteTestimonialMutation,
} = testimonialApi;
