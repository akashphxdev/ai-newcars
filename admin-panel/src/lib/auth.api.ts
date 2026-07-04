// src/lib/auth.api.ts

import { api } from "../store/baseApi";

export interface AuthAdmin {
  id: number;
  name: string;
  email: string;
  mobile: string;
  roleId: number;
  status: string;
  role?: {
    id: number;
    roleName: string;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginStep1Response {
  adminId: number;
  email: string;
  maskedMobile: string;
  message: string;
}

export interface VerifyOtpInput {
  adminId: number;
  otp: string;
}

export interface LoginStep2Response {
  admin: { id: number; name: string; email: string; roleId: number };
  token: string;
}

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

const AUTH_ME_TAG = { type: "Auth" as const, id: "ME" };

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginStep1Response, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", data: body }),
      transformResponse: (res: ApiEnvelope<LoginStep1Response>) => res.data,
    }),

    verifyOtp: builder.mutation<LoginStep2Response, VerifyOtpInput>({
      query: (body) => ({ url: "/auth/verify-otp", method: "POST", data: body }),
      transformResponse: (res: ApiEnvelope<LoginStep2Response>) => res.data,
      invalidatesTags: [AUTH_ME_TAG],
    }),

    resendOtp: builder.mutation<void, { adminId: number }>({
      query: (body) => ({ url: "/auth/resend-otp", method: "POST", data: body }),
    }),

    getMe: builder.query<AuthAdmin, void>({
      query: () => ({ url: "/auth/me", method: "GET" }),
      transformResponse: (res: ApiEnvelope<AuthAdmin>) => res.data,
      providesTags: [AUTH_ME_TAG],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: [AUTH_ME_TAG],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGetMeQuery,
  useLogoutMutation,
} = authApi;