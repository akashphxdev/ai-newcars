// src/pages/Ai/Settings/automationRule.api.ts
import { api } from "../../../store/baseApi";

export interface AiAutomationRuleRecord {
  id: number;
  featureKey: number;
  enabled: boolean;
  frequencyMinutes: number;
  countPerRun: number;
  language: string;
  autoPublish: boolean;
  maxTotal: number | null;
  imageFolder: string | null;
  autoPickImages: boolean;
  autoDelete: boolean;
  keepLatest: number | null;
  deleteStrategy: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpsertAutomationRuleInput {
  enabled: boolean;
  frequencyMinutes: number;
  countPerRun: number;
  language: "english" | "hindi" | "hinglish";
  autoPublish: boolean;
  maxTotal?: number | null;
  imageFolder?: string | null;
  autoPickImages: boolean;
  autoDelete: boolean;
  keepLatest?: number | null;
  deleteStrategy: "latest" | "lowestViews";
}

interface AutomationRuleListRawResponse {
  success: true;
  data: AiAutomationRuleRecord[];
}

interface AutomationRuleSingleRawResponse {
  success: true;
  data: AiAutomationRuleRecord | null;
}

export const automationRuleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // One call covers every feature's card on the Settings page — there's
    // no per-feature GET needed there (that route exists separately for
    // other callers, e.g. a future generator job checking its own rule).
    getAutomationRules: builder.query<AiAutomationRuleRecord[], void>({
      query: () => ({ url: "/ai/automation-rules", method: "GET" }),
      transformResponse: (res: AutomationRuleListRawResponse) => res.data,
      providesTags: ["AiAutomationRule"],
    }),

    upsertAutomationRule: builder.mutation<
      AiAutomationRuleRecord,
      { featureKey: number; input: UpsertAutomationRuleInput }
    >({
      query: ({ featureKey, input }) => ({
        url: `/ai/automation-rules/${featureKey}`,
        method: "PUT",
        data: input,
      }),
      transformResponse: (res: AutomationRuleSingleRawResponse) => res.data as AiAutomationRuleRecord,
      invalidatesTags: ["AiAutomationRule"],
    }),
  }),
});

export const { useGetAutomationRulesQuery, useUpsertAutomationRuleMutation } = automationRuleApi;