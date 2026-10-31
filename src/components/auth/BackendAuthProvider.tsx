"use client";
import { Toast } from "@/components/ui/Toast";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthContext, type AuthRole, type DemoUser } from "./AuthProvider";
import {
  api,
  restoreSession,
  saveSession,
  type ApiProfile,
  type AuthResult,
  ApiError,
} from "@/lib/api";
export function backendUser(p: ApiProfile): DemoUser {
  return {
    id: p.id,
    name: p.full_name,
    email: p.email ?? "",
    phone: p.phone ?? "",
    role: p.role.toUpperCase() as AuthRole,
    avatarUrl: p.avatar_url ?? undefined,
  };
}
export function BackendAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    async function restore() {
      const request = ++generation.current;
      try {
        if (restoreSession()) {
          const p = await api<ApiProfile>("/auth/me");
          if (active && request === generation.current) setUser(backendUser(p));
        } else if (active) setUser(null);
      } catch (error) {
        if (active && request === generation.current) {
          setNotice((error as Error).message);
          if (error instanceof ApiError && error.status === 401) {
            saveSession(null);
            setUser(null);
          }
        }
      } finally {
        if (active) setReady(true);
      }
    }
    void restore();
    const onChange = () => {
      void restore();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "hilaw-api-session-v1" || e.key === null) {
        setFormVersion((version) => version + 1);
        void restore();
      }
    };
    window.addEventListener("hilaw-profile-changed", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("hilaw-profile-changed", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  async function signIn(email: string, password: string, remember: boolean) {
    const request = ++generation.current;
    const result = await api<AuthResult>(
      "/auth/signin",
      {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      },
      false,
    );
    if (!result.session || !result.profile)
      throw new Error("Sesi belum tersedia.");
    if (request !== generation.current)
      throw new Error(
        "Proses masuk dibatalkan karena sesi telah berubah. Silakan coba lagi.",
      );
    saveSession(result.session, remember);
    const account = backendUser(result.profile);
    setUser(account);
    setFormVersion((version) => version + 1);
    return account;
  }
  async function signUp(
    input: Omit<DemoUser, "id">,
    password: string,
    confirmPassword = password,
  ) {
    const request = ++generation.current;
    const result = await api<AuthResult>(
      "/auth/signup",
      {
        method: "POST",
        body: JSON.stringify({
          full_name: input.name,
          email: input.email.trim(),
          ...(input.phone ? { phone: input.phone } : {}),
          role: input.role.toLowerCase(),
          password,
          confirm_password: confirmPassword,
        }),
      },
      false,
    );
    if (request !== generation.current)
      throw new Error(
        "Proses pendaftaran selesai, tetapi sesi telah berubah. Silakan Sign In.",
      );
    if (!result.session || !result.profile) {
      setFormVersion((version) => version + 1);
      setNotice("Akun berhasil dibuat. Silakan Sign In untuk melanjutkan.");
      return null;
    }
    saveSession(result.session, false);
    const account = backendUser(result.profile);
    setUser(account);
    setFormVersion((version) => version + 1);
    return account;
  }
  async function logout() {
    const request = ++generation.current;
    try {
      await api("/auth/signout", { method: "POST" });
      if (request !== generation.current) return;
      saveSession(null);
      setUser(null);
      setFormVersion((version) => version + 1);
      setNotice("Anda berhasil keluar.");
    } catch (error) {
      if (request !== generation.current) return;
      if (error instanceof ApiError && error.status === 401) {
        saveSession(null);
        setUser(null);
        setFormVersion((version) => version + 1);
      }
      setNotice((error as Error).message);
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        notice,
        formVersion,
        signIn,
        signUp,
        logout,
        dismiss: () => setNotice(""),
      }}
    >
      {children}
      <Toast message={notice} onClose={() => setNotice("")} />
    </AuthContext.Provider>
  );
}
