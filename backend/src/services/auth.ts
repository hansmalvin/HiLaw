import { authClient, database } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import type { z } from "zod";
import type { signup, signin } from "../validators/index.js";
export async function currentUser(userId: string) {
  const { data, error } = await database
    .from("profiles")
    .select("id,full_name,email,phone,role,avatar_url,created_at,updated_at")
    .eq("id", userId)
    .single();
  check(error);
  if (!data) throw new ApiError(404, "Profil tidak ditemukan.");
  if (data.role !== "lawyer") return { ...data, lawyer_profile: null };
  const lawyer = await database
    .from("lawyer_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  check(lawyer.error);
  return {
    ...data,
    verification_status: lawyer.data.verification_status,
    lawyer_profile: lawyer.data,
  };
}
export async function signUp(input: z.infer<typeof signup>) {
  // Coursework signup: create an already-confirmed Auth user, without email delivery.
  const { data, error } = await database.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      phone: input.phone ?? "",
      role: input.role,
    },
  });
  if (error || !data.user) {
    const duplicate =
      error?.code === "email_exists" || error?.code === "user_already_exists";
    throw new ApiError(
      duplicate ? 409 : error?.status === 429 ? 429 : 400,
      duplicate
        ? "Email sudah terdaftar. Silakan Sign In."
        : "Pendaftaran gagal. Periksa kembali data Anda.",
    );
  }
  const login = await authClient().auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (login.error || !login.data.session) {
    throw new ApiError(
      502,
      "Akun berhasil dibuat, tetapi login otomatis gagal. Silakan Sign In.",
    );
  }
  return {
    session: login.data.session,
    profile: await currentUser(data.user.id),
    email_confirmation_required: false,
  };
}

export async function signIn(input: z.infer<typeof signin>) {
  const { data, error } = await authClient().auth.signInWithPassword(input);
  if (error || !data.session)
    throw new ApiError(
      error?.status === 429 ? 429 : 401,
      "Email atau password tidak sesuai.",
    );
  return { session: data.session, profile: await currentUser(data.user.id) };
}
export async function refreshSession(refreshToken: string) {
  const { data, error } = await authClient().auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session || !data.user)
    throw new ApiError(401, "Sesi berakhir. Silakan masuk kembali.");
  return { session: data.session, profile: await currentUser(data.user.id) };
}
export async function signOut(token: string) {
  const { error } = await database.auth.admin.signOut(token, "local");
  if (error) throw new ApiError(502, "Gagal mencabut sesi. Coba lagi.");
}
