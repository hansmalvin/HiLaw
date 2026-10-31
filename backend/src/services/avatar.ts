import { randomUUID } from "node:crypto";
import { database } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import { fileExtension } from "../utils/file.js";
import type { Profile } from "../types/index.js";
export const AVATAR_BUCKET = "profile-avatars";
function ownedPath(userId: string, url: string | null) {
  if (!url) return null;
  const prefix = database.storage.from(AVATAR_BUCKET).getPublicUrl("")
    .data.publicUrl;
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return path.startsWith(userId + "/") && !path.includes("..") ? path : null;
}
export async function removeOwnedAvatar(userId: string, url: string | null) {
  const path = ownedPath(userId, url);
  if (path) {
    const result = await database.storage.from(AVATAR_BUCKET).remove([path]);
    check(result.error);
  }
}
export async function uploadAvatar(actor: Profile, file?: Express.Multer.File) {
  if (!["customer", "lawyer"].includes(actor.role))
    throw new ApiError(
      403,
      "Upload ini hanya untuk profil customer dan pengacara.",
    );
  if (
    !file ||
    !["image/jpeg", "image/png"].includes(file.mimetype) ||
    file.size > 2 * 1024 * 1024
  )
    throw new ApiError(400, "Pilih foto JPG atau PNG maksimal 2 MB.");
  const extension = fileExtension(file.buffer, file.mimetype);
  const path = `${actor.id}/${randomUUID()}.${extension}`;
  const uploaded = await database.storage
    .from(AVATAR_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  check(uploaded.error);
  const url = database.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    .data.publicUrl;
  const updated = await database.rpc("update_own_profile", {
    p_user_id: actor.id,
    p_patch: { avatar_url: url },
  });
  if (updated.error) {
    await database.storage.from(AVATAR_BUCKET).remove([path]);
    check(updated.error);
  }
  try {
    await removeOwnedAvatar(actor.id, actor.avatar_url);
  } catch {
    console.error("Foto profil lama belum dapat dibersihkan.");
  }
}
