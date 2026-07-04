// src/context/AuthContext.tsx
import { useEffect, type ReactNode } from "react";
import { useGetMeQuery, useLogoutMutation } from "../lib/auth.api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasToken = !!localStorage.getItem("admin_token");

  const {
    data: admin,
    isLoading,
    isFetching,
    isUninitialized,
    error,
  } = useGetMeQuery(undefined, { skip: !hasToken });

  const [logoutMutation] = useLogoutMutation();
  useEffect(() => {
    if (error) {
      localStorage.removeItem("admin_token");
    }
  }, [error]);

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Network/server failure must never block logout.
    } finally {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin: admin ?? null,
        isLoading: hasToken ? isLoading || isFetching || isUninitialized : false,
        isAuthenticated: !!admin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}