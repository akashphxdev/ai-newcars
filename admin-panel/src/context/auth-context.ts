// src/context/auth-context.ts
import { createContext } from "react";
import type { AuthAdmin } from "../lib/auth.api";

export interface AuthContextValue {
  admin: AuthAdmin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);