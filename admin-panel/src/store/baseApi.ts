// src/store/baseApi.ts
import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { apiClient, extractApiError } from "../lib/apiClient";

interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
}

interface AxiosBaseQueryError {
  status?: number;
  message: string;
}

export const axiosBaseQuery = (): BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  AxiosBaseQueryError
> => {
  return async ({ url, method = "GET", data, params }) => {
    try {

      const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
      const result = await apiClient({
        url,
        method,
        data,
        params,
        ...(isFormData ? { headers: { "Content-Type": undefined } } : {}),
      });
      return { data: result.data };
    } catch (err) {
      const axiosErr = err as AxiosError;
      return {
        error: {
          status: axiosErr.response?.status,
          message: extractApiError(err),
        },
      };
    }
  };
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Auth", "Admin", "Role", "Permission", "AdminLog", "Country", "State", "District", "City", "Brand",
             "CarModel", "Variant", "PowertrainIce", "PowertrainElectric", "CarColor", "CarImage", "Feature", "Faq",
             "Offer", "Video", "BodyType", "AttributeOption", "Article", "ArticleCategory", "ArticleComment",
             "StoryGroup", "StoryItem", "Advertiser", "AdPlacement", "AdCampaign", "AiFaq", "AiSetting", "AiAutomationRule", "AiLog"],
  endpoints: () => ({}),
});