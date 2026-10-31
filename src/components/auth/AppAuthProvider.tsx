"use client";
import type { ReactNode } from "react";
import { BackendAuthProvider } from "./BackendAuthProvider";
export function AppAuthProvider({ children }: { children: ReactNode }) {
  return <BackendAuthProvider>{children}</BackendAuthProvider>;
}
