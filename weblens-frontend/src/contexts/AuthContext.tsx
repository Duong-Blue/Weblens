"use client";

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from "react";
import { User } from "@/types";
import { useGetProfileQuery, useLogoutMutation } from "@/services/api/authApi";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, clearUser } from "@/store/slices/authSlice";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);

  const { isLoading: isProfileLoading, isError } = useGetProfileQuery();
  const [triggerLogout] = useLogoutMutation();

  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    if (!isProfileLoading) {
      setTimeout(() => setIsInitializing(false), 0);
    }
  }, [isProfileLoading]);

  const logout = useCallback(() => {
    triggerLogout().finally(() => {
      dispatch(clearUser());
      router.push("/login");
    });
  }, [triggerLogout, dispatch, router]);

  /* Redirect logic based on auth state */
  useEffect(() => {
    if (isInitializing) return;

    const publicPaths = ["/login", "/register", "/"];
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isInitializing, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading: isInitializing, logout }}>
      {isInitializing ? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
