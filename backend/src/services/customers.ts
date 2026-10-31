import { removeOwnedAvatar } from "./avatar.js";
import { database } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import type { Profile } from "../types/index.js";
export async function listCustomers(
  actor: Profile,
  page: number,
  limit: number,
) {
  if (actor.role !== "admin")
    throw new ApiError(403, "Hanya admin yang dapat melihat customer.");
  const result = await database
    .from("profiles")
    .select("id,full_name,email,phone,created_at", { count: "exact" })
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * limit, page * limit - 1);
  check(result.error);
  const items = await Promise.all(
    (result.data ?? []).map(async (profile) => {
      const auth = await database.auth.admin.getUserById(profile.id);
      if (auth.error || !auth.data.user)
        throw new ApiError(
          502,
          "Status login customer belum dapat dimuat. Silakan muat ulang.",
        );
      return {
        ...profile,
        last_sign_in_at: auth.data.user.last_sign_in_at ?? null,
      };
    }),
  );
  return { items, total: result.count ?? 0, page, limit };
}
export async function deleteCustomer(actor: Profile, id: string) {
  if (actor.role !== "admin" || actor.id === id)
    throw new ApiError(403, "Penghapusan akun tidak diizinkan.");
  const result = await database
    .from("profiles")
    .select("id,role,avatar_url")
    .eq("id", id)
    .maybeSingle();
  check(result.error);
  if (!result.data)
    throw new ApiError(404, "Customer tidak ditemukan atau sudah dihapus.");
  if (result.data.role !== "customer")
    throw new ApiError(
      403,
      "Endpoint ini hanya dapat menghapus akun customer.",
    );
  await removeOwnedAvatar(id, result.data.avatar_url ?? null);
  const removed = await database.auth.admin.deleteUser(id);
  check(removed.error);
}
