// src/pages/LandingPages/landingPage.api.ts
//
// Campaign landing pages served at timesauto.net/drive/<slug>/. They are
// files on disk rather than rows, so the slug is the identity here — no
// numeric id to key off.

import { api } from "../../store/baseApi";

export interface LandingPageRecord {
  slug: string;
  url: string;
  hasIndex: boolean;
  title: string | null;
  assetCount: number;
  sizeBytes: number;
  updatedAt: string | null;
}

export interface LandingPageDetail extends LandingPageRecord {
  html: string;
}

const LANDING_LIST_TAG = { type: "LandingPage" as const, id: "LIST" };

export const landingPageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLandingPages: builder.query<LandingPageRecord[], void>({
      query: () => ({ url: "/landing-pages", method: "GET" }),
      transformResponse: (res: { data: LandingPageRecord[] }) => res.data,
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: "LandingPage" as const, id: p.slug })), LANDING_LIST_TAG]
          : [LANDING_LIST_TAG],
    }),

    getLandingPage: builder.query<LandingPageDetail, string>({
      query: (slug) => ({ url: `/landing-pages/${slug}`, method: "GET" }),
      transformResponse: (res: { data: LandingPageDetail }) => res.data,
      providesTags: (_r, _e, slug) => [{ type: "LandingPage" as const, id: slug }],
    }),

    saveLandingPage: builder.mutation<LandingPageRecord, { slug: string; html: string }>({
      query: (body) => ({ url: "/landing-pages", method: "POST", data: body }),
      transformResponse: (res: { data: LandingPageRecord }) => res.data,
      invalidatesTags: (_r, _e, arg) => [LANDING_LIST_TAG, { type: "LandingPage", id: arg.slug }],
    }),

    uploadLandingAssets: builder.mutation<LandingPageRecord, { slug: string; files: File[] }>({
      query: ({ slug, files }) => {
        const form = new FormData();
        // Uploaded under the exact filename the page references, so a
        // hero image keeps working without editing the HTML.
        files.forEach((file) => form.append("files", file, file.name));
        return { url: `/landing-pages/${slug}/assets`, method: "POST", data: form };
      },
      transformResponse: (res: { data: LandingPageRecord }) => res.data,
      invalidatesTags: (_r, _e, arg) => [LANDING_LIST_TAG, { type: "LandingPage", id: arg.slug }],
    }),

    deleteLandingPage: builder.mutation<null, string>({
      query: (slug) => ({ url: `/landing-pages/${slug}`, method: "DELETE" }),
      invalidatesTags: [LANDING_LIST_TAG],
    }),
  }),
});

export const {
  useGetLandingPagesQuery,
  useGetLandingPageQuery,
  useSaveLandingPageMutation,
  useUploadLandingAssetsMutation,
  useDeleteLandingPageMutation,
} = landingPageApi;
