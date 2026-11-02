import { removeOwnedAvatar } from "./avatar.js";
import { database, authClient, KTA_BUCKET } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import type { Profile } from "../types/index.js";
export async function updateProfile(
  actor: Profile,
  patch: Record<string, unknown>,
) {
  const result = await database.rpc("update_own_profile", {
    p_user_id: actor.id,
    p_patch: patch,
  });
  check(result.error);
}
export async function deleteProfile(actor: Profile, password: string) {
  if (!actor.email) throw new ApiError(400, "Akun tidak memiliki email.");
  const { error } = await authClient().auth.signInWithPassword({
    email: actor.email,
    password,
  });
  if (error) throw new ApiError(401, "Konfirmasi password tidak sesuai.");
  // Storage objects must be deleted through Storage API, never SQL.
  const lawyer = await database
    .from("lawyer_profiles")
    .select("id")
    .eq("user_id", actor.id)
    .maybeSingle();
  check(lawyer.error);
  if (lawyer.data) {
    const history = await database
      .from("lawyer_verifications")
      .select("kta_file_path")
      .eq("lawyer_id", lawyer.data.id);
    check(history.error);
    const paths = (history.data ?? [])
      .map((v) => v.kta_file_path)
      .filter((s): s is string => !!s);
    if (paths.length) {
      const removed = await database.storage.from(KTA_BUCKET).remove(paths);
      check(removed.error);
    }
  }
  await removeOwnedAvatar(actor.id, actor.avatar_url);
  const deleted = await database.auth.admin.deleteUser(actor.id);
  check(deleted.error);
}
export async function publicLawyers() {
  const { data, error } = await database
    .from("lawyer_profiles")
    .select(
      "id,user_id,specialization,experience_years,organization,bio,verification_status,rate_points,is_online,profiles!inner(full_name,avatar_url)",
    )
    .eq("verification_status", "approved")
    .order("created_at", { ascending: false });
  check(error);
  const lawyers = data ?? [];
  // shortcut: ratings aggregated in JS from all reviews; add a rating column/view once reviews reach thousands.
  const ratings = await database
    .from("reviews")
    .select("lawyer_id,rating")
    .in(
      "lawyer_id",
      lawyers.map((l) => l.id),
    );
  check(ratings.error);
  return lawyers.map((l) => {
    const own = (ratings.data ?? []).filter((r) => r.lawyer_id === l.id);
    return {
      ...l,
      review_count: own.length,
      rating: own.length
        ? Math.round(
            (own.reduce((s, r) => s + r.rating, 0) / own.length) * 10,
          ) / 10
        : 0,
    };
  });
}
