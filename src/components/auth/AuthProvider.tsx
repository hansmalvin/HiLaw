"use client";

import { publicLawyers } from "@/data/publicData";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AuthRole = "CUSTOMER" | "LAWYER" | "ADMIN";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AuthRole;
}

interface Account extends DemoUser {
  passwordHash: string;
}

interface AuthContextValue {
  user: DemoUser | null;
  ready: boolean;
  notice: string;
  signIn: (
    email: string,
    password: string,
    remember: boolean,
  ) => Promise<DemoUser>;
  signUp: (input: Omit<DemoUser, "id">, password: string) => Promise<DemoUser>;
  logout: () => void;
  switchRole: (role: AuthRole) => void;
  dismiss: () => void;
  switchLawyer: (id: string) => void;
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

export const demoUsers: DemoUser[] = [
  {
    id: "demo-customer",
    name: "Aulia Rahma",
    email: "customer@hilaw.demo",
    phone: "081234567890",
    role: "CUSTOMER",
  },
  {
    id: "demo-lawyer",
    name: "Nadira Putri",
    email: "lawyer@hilaw.demo",
    phone: "081234567891",
    role: "LAWYER",
  },
  {
    id: "demo-admin",
    name: "Admin HiLaw",
    email: "admin@hilaw.demo",
    phone: "081234567892",
    role: "ADMIN",
  },
  ...publicLawyers
    .filter((l) => l.id !== "nadira")
    .map((l) => ({
      id: "demo-lawyer-" + l.id,
      name: l.name,
      email: l.id + "@hilaw.demo",
      phone: "081234567891",
      role: "LAWYER" as const,
    })),
];

const SESSION = "hilaw-auth-session-v1",
  ACCOUNTS = "hilaw-auth-accounts-v1";

const AuthContext = createContext<AuthContextValue | null>(null);

function validUser(value: unknown): value is DemoUser {
  if (!value || typeof value !== "object") return false;
  const u = value as DemoUser;

  return (
    typeof u.id === "string" &&
    typeof u.name === "string" &&
    typeof u.email === "string" &&
    typeof u.phone === "string" &&
    ["CUSTOMER", "LAWYER", "ADMIN"].includes(u.role)
  );
}

const publicUser = (u: DemoUser): DemoUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
});

async function hash(password: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );

  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function accounts(): Account[] {
  const data = JSON.parse(localStorage.getItem(ACCOUNTS) || "[]");
  if (
    !Array.isArray(data) ||
    !data.every(
      (a) =>
        validUser(a) &&
        "passwordHash" in a &&
        typeof a.passwordHash === "string",
    )
  )
    throw new Error(
      "Data akun demo rusak. Hapus data situs di browser lalu coba lagi.",
    );

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const restore = () => {
      try {
        const raw =
          sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION);
        const saved = raw ? JSON.parse(raw) : null;
        setUser(validUser(saved) ? publicUser(saved) : null);
      } catch {
        setUser(null);
        setNotice("Session tidak dapat dimuat. Silakan masuk kembali.");
      }
      setReady(true);
    };
    restore();
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION || event.key === null) restore();
    };
    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function persist(u: DemoUser, remember: boolean) {
    try {
      localStorage.removeItem(SESSION);
      sessionStorage.removeItem(SESSION);
      (remember ? localStorage : sessionStorage).setItem(
        SESSION,
        JSON.stringify(publicUser(u)),
      );
    } catch {
      throw new Error(
        "Penyimpanan browser tidak tersedia. Aktifkan penyimpanan situs untuk masuk.",
      );
    }
    setUser(publicUser(u));
  }

  async function signIn(email: string, password: string, remember: boolean) {
    const normalized = email.trim().toLowerCase();
    let account: DemoUser | undefined = demoUsers.find(
      (u) => u.email === normalized && password === "HiLaw123!",
    );
    if (!account) {
      const stored = accounts().find((a) => a.email === normalized);
      if (stored && stored.passwordHash === (await hash(password)))
        account = stored;
    }
    if (!account) throw new Error("Email atau password tidak sesuai.");
    persist(account, remember);
    setNotice("Berhasil masuk. Selamat datang, " + account.name + ".");

    return publicUser(account);
  }

  async function signUp(input: Omit<DemoUser, "id">, password: string) {
    if (!["CUSTOMER", "LAWYER"].includes(input.role))
      throw new Error("Pendaftaran publik hanya untuk Customer dan Pengacara.");
    if (
      !input.name.trim() ||
      !/^\S+@\S+\.\S+$/.test(input.email) ||
      !/^\+?[\d\s-]{9,16}$/.test(input.phone) ||
      password.length < 8
    )
      throw new Error("Periksa kembali data pendaftaran Anda.");
    const email = input.email.trim().toLowerCase();
    const existing = accounts();
    if ([...demoUsers, ...existing].some((a) => a.email === email))
      throw new Error("Email sudah terdaftar. Silakan Sign In.");
    const account: Account = {
      ...input,
      name: input.name.trim(),
      email,
      id: crypto.randomUUID(),
      passwordHash: await hash(password),
    };
    localStorage.setItem(ACCOUNTS, JSON.stringify([...existing, account]));
    persist(account, false);
    setNotice("Akun demo berhasil dibuat. Selamat datang!");

    return publicUser(account);
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION);
      sessionStorage.removeItem(SESSION);
    } catch {}
    setUser(null);
    setNotice("Anda berhasil keluar.");
  }

  function switchLawyer(id: string) {
    const account = demoUsers.find(
      (u) => u.id === (id === "nadira" ? "demo-lawyer" : "demo-lawyer-" + id),
    );
    if (account) {
      try {
        persist(account, false);
        setNotice("Akun demo pengacara diganti.");
      } catch (error) {
        setNotice((error as Error).message);
      }
    }
  }

  function switchRole(role: AuthRole) {
    const demo = demoUsers.find((u) => u.role === role)!;
    try {
      persist(demo, false);
      setNotice("Mode demo " + roleLabel[role] + " aktif.");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        notice,
        signIn,
        signUp,
        logout,
        switchRole,
        switchLawyer,
        dismiss: () => setNotice(""),
      }}
    >
      {children}
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Tutup notifikasi">
            ×
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider diperlukan");

  return auth;
}
