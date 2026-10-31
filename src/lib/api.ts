export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"
).replace(/\/$/, "");
export interface ApiLawyer {
  id: string;
  user_id: string;
  specialization: string | null;
  experience_years: number;
  organization: string | null;
  kta_number: string | null;
  bio: string | null;
  verification_status: "not_submitted" | "pending" | "approved" | "rejected";
}
export interface ApiProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: "admin" | "lawyer" | "customer";
  avatar_url: string | null;
  lawyer_profile: ApiLawyer | null;
}
export interface Verification {
  id: string;
  lawyer_id: string;
  full_name: string;
  kta_number: string;
  organization: string;
  specialization: string;
  experience_years: number;
  kta_file_path: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}
interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
export interface AuthResult {
  session: Session | null;
  profile: ApiProfile | null;
  email_confirmation_required?: boolean;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const SESSION_KEY = "hilaw-api-session-v1";
let session: Session | null = null;
let persistent = false;
let refreshing: Promise<void> | null = null;
export function restoreSession() {
  const saved =
    sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  persistent =
    !sessionStorage.getItem(SESSION_KEY) && !!localStorage.getItem(SESSION_KEY);
  try {
    session = saved ? JSON.parse(saved) : null;
  } catch {
    session = null;
  }
  if (
    session &&
    (typeof session.access_token !== "string" ||
      typeof session.refresh_token !== "string" ||
      !Number.isFinite(session.expires_at))
  )
    session = null;
  return !!session;
}
export function saveSession(value: Session | null, remember = persistent) {
  session = value;
  persistent = remember;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  if (value)
    (remember ? localStorage : sessionStorage).setItem(
      SESSION_KEY,
      JSON.stringify(value),
    );
}
async function refreshAccess() {
  if (!refreshing)
    refreshing = (async () => {
      const previous = session;
      const result = await api<AuthResult>(
        "/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: session?.refresh_token }),
        },
        false,
      );
      if (
        session?.refresh_token === previous?.refresh_token &&
        session?.access_token === previous?.access_token
      )
        saveSession(result.session);
    })().finally(() => {
      refreshing = null;
    });
  return refreshing;
}
export async function api<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  if (
    authenticated &&
    session &&
    session.expires_at * 1000 < Date.now() + 30000
  )
    await refreshAccess();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (authenticated && session)
    headers.set("Authorization", "Bearer " + session.access_token);
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      ...init,
      headers,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "Backend tidak dapat dihubungi. Periksa server dan koneksi Anda.",
    );
  }
  const result = await response.json();
  if (!response.ok || !result.success)
    throw new ApiError(response.status, result.message || "Request gagal.");
  return result.data as T;
}
export const reloadRemote = () =>
  window.dispatchEvent(new Event("hilaw-profile-changed"));
export async function openDocument(id: string, admin = false) {
  if (session && session.expires_at * 1000 < Date.now() + 30000)
    await refreshAccess();
  const response = await fetch(
    API_URL +
      (admin ? "/admin/verifications/" : "/lawyer/verifications/") +
      id +
      "/document",
    {
      headers: { Authorization: "Bearer " + session?.access_token },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Dokumen tidak dapat dibuka.");
  }
  const url = URL.createObjectURL(await response.blob());
  return url;
}
