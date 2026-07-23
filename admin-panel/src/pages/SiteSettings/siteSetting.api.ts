// src/pages/Settings/Site/siteSetting.api.ts
//
// RTK Query version for the site settings singleton (maintenance mode,
// contact details, social links).

import { api } from "./../../store/baseApi";

export interface SiteSettingRecord {
  id: number;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  supportEmail: string | null;
  contactEmail: string | null;
  contactNumber: string | null;
  whatsappNumber: string | null;
  address: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string | null;
}

// All fields optional. For the string fields, `null` explicitly clears
// the stored value — omitting the key leaves it untouched.
export interface UpsertSiteSettingInput {
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  supportEmail?: string | null;
  contactEmail?: string | null;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
}

interface SiteSettingRawResponse {
  success: true;
  data: SiteSettingRecord | null;
}

export const siteSettingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSiteSettings: builder.query<SiteSettingRecord | null, void>({
      query: () => ({ url: "/site-settings", method: "GET" }),
      transformResponse: (res: SiteSettingRawResponse) => res.data,
      providesTags: ["SiteSetting"],
    }),

    upsertSiteSettings: builder.mutation<SiteSettingRecord, UpsertSiteSettingInput>({
      query: (input) => ({ url: "/site-settings", method: "PUT", data: input }),
      transformResponse: (res: SiteSettingRawResponse) => res.data as SiteSettingRecord,
      invalidatesTags: ["SiteSetting"],
    }),
  }),
});

export const { useGetSiteSettingsQuery, useUpsertSiteSettingsMutation } = siteSettingApi;