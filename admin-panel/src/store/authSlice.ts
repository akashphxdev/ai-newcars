// src/store/authSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthAdmin } from "../lib/auth.api";

interface AuthState {
  admin: AuthAdmin | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  admin: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAdmin(state, action: PayloadAction<AuthAdmin>) {
      state.admin = action.payload;
      state.isLoading = false;
    },
    clearAdmin(state) {
      state.admin = null;
      state.isLoading = false;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setAdmin, clearAdmin, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;