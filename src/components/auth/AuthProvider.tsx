"use client";
import { createContext, useContext } from "react";
export type AuthRole = "CUSTOMER" | "LAWYER" | "ADMIN";
// Kept as a type name for the consultation mock store; identities come from API.
export interface DemoUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AuthRole;
  avatarUrl?: string;
}
interface AuthContextValue {
  user: DemoUser | null;
  ready: boolean;
  notice: string;
  formVersion: number;
  signIn: (
    email: string,
    password: string,
    remember: boolean,
  ) => Promise<DemoUser>;
  signUp: (
    input: Omit<DemoUser, "id">,
    password: string,
    confirmPassword?: string,
  ) => Promise<DemoUser | null>;
  logout: () => Promise<void>;
  dismiss: () => void;
}
export const dashboardPath = (role: AuthRole) =>
  role === "ADMIN"
    ? "/admin"
    : role === "LAWYER"
      ? "/lawyer/dashboard"
      : "/customer/dashboard";

export const roleLabel: Record<AuthRole, string> = {
  CUSTOMER: "Customer",
  LAWYER: "Pengacara",
  ADMIN: "Admin",
};

export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider diperlukan");
  return auth;
}
