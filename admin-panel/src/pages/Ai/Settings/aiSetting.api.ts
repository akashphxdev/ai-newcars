// src/pages/Ai/Settings/aiSetting.api.ts
//
// RTK Query version for the AI provider settings singleton. provider is
// a numeric code — see AI_PROVIDER_OPTIONS in lib/aiLookups.ts (mirrors
// AI_PROVIDER_CODES in backend/src/modules/ai/ai.constants.ts).

import { api } from "../../../store/baseApi";

export interface AiSettingRecord {
  id: number;
  provider: number;
  baseUrl: string | null;
  // The real apiKey is never sent to the client — only whether one is
  // saved, and a masked preview (e.g. "sk-••••1234") for display.
  hasApiKey: boolean;
  maskedApiKey: string | null;
  model: string;
  language: string;
  autoSaveMode: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpsertAiSettingInput {
  provider: number;
  baseUrl?: string;
  // Omit entirely to keep whatever key is already saved server-side —
  // only include this when the admin actually types a new one.
  apiKey?: string;
  model: string;
  language: "english" | "hindi" | "hinglish";
  autoSaveMode: "draft" | "preview";
}

export interface TestAiConnectionInput {
  provider: number;
  baseUrl?: string;
  apiKey?: string;
  model: string;
}

export interface TestAiConnectionResult {
  status: "success" | "error";
  message: string;
}

interface AiSettingRawResponse {
  success: true;
  data: AiSettingRecord | null;
}

interface TestConnectionRawResponse {
  success: true;
  data: TestAiConnectionResult;
}

export const aiSettingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiSettings: builder.query<AiSettingRecord | null, void>({
      query: () => ({ url: "/ai/settings", method: "GET" }),
      transformResponse: (res: AiSettingRawResponse) => res.data,
      providesTags: ["AiSetting"],
    }),

    upsertAiSettings: builder.mutation<AiSettingRecord, UpsertAiSettingInput>({
      query: (input) => ({ url: "/ai/settings", method: "PUT", data: input }),
      transformResponse: (res: AiSettingRawResponse) => res.data as AiSettingRecord,
      invalidatesTags: ["AiSetting"],
    }),

    // Stateless check — always uses whatever provider/baseUrl/apiKey/model
    // is currently in the form, not the saved settings, so an admin can
    // test before saving.
    testAiConnection: builder.mutation<TestAiConnectionResult, TestAiConnectionInput>({
      query: (input) => ({ url: "/ai/settings/test-connection", method: "POST", data: input }),
      transformResponse: (res: TestConnectionRawResponse) => res.data,
    }),
  }),
});

export const {
  useGetAiSettingsQuery,
  useUpsertAiSettingsMutation,
  useTestAiConnectionMutation,
} = aiSettingApi;
