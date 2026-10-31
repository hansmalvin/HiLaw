import { randomUUID } from "node:crypto";
import { database, KTA_BUCKET } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import { fileExtension } from "../utils/file.js";
import type { Profile } from "../types/index.js";
export async function ownVerification(actor: Profile) {
  const lawyer = await database
    .from("lawyer_profiles")
    .select("*")
    .eq("user_id", actor.id)
    .single();
  check(lawyer.error);
  const history = await database
    .from("lawyer_verifications")
    .select("*")
    .eq("lawyer_id", lawyer.data.id)
    .order("submitted_at", { ascending: false });
  check(history.error);
  return { lawyer: lawyer.data, history: history.data };
}
export async function submitVerification(
  actor: Profile,
  input: Record<string, unknown>,
  file: Express.Multer.File | undefined,
  resubmit: boolean,
) {
  if (!file) throw new ApiError(400, "Pilih file KTA demonstrasi.");
  const extension = fileExtension(file.buffer, file.mimetype);
  const path = `${actor.id}/${randomUUID()}.${extension}`;
  const uploaded = await database.storage
    .from(KTA_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  check(uploaded.error);
  const result = await database.rpc("submit_lawyer_verification", {
    p_user_id: actor.id,
    p_input: input,
    p_file_path: path,
    p_resubmit: resubmit,
  });
  if (result.error) {
    const cleanup = await database.storage.from(KTA_BUCKET).remove([path]);
    if (cleanup.error)
      console.error("KTA cleanup gagal; periksa orphan object:", path);
    check(result.error);
  }
  return result.data;
}
export async function listVerifications(
  status: string | undefined,
  page: number,
  limit: number,
) {
  let query = database
    .from("lawyer_verifications")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .order("id");
  if (status) query = query.eq("status", status);
  const result = await query.range((page - 1) * limit, page * limit - 1);
  check(result.error);
  return { items: result.data, total: result.count, page, limit };
}
export async function verificationDetail(id: string) {
  const { data, error } = await database
    .from("lawyer_verifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  check(error);
  if (!data) throw new ApiError(404, "Pengajuan tidak ditemukan.");
  return data;
}
export async function reviewVerification(
  actor: Profile,
  id: string,
  decision: "approved" | "rejected",
  reason?: string,
) {
  const result = await database.rpc("review_lawyer_verification", {
    p_admin_id: actor.id,
    p_verification_id: id,
    p_decision: decision,
    p_reason: reason ?? null,
  });
  check(result.error);
  return result.data;
}
export async function document(actor: Profile, id: string) {
  const application = await verificationDetail(id);
  if (actor.role !== "admin") {
    const owner = await database
      .from("lawyer_profiles")
      .select("user_id")
      .eq("id", application.lawyer_id)
      .single();
    check(owner.error);
    if (!owner.data || owner.data.user_id !== actor.id)
      throw new ApiError(403, "Dokumen bukan milik Anda.");
  }
  if (!application.kta_file_path)
    throw new ApiError(404, "Dokumen tidak tersedia.");
  const result = await database.storage
    .from(KTA_BUCKET)
    .download(application.kta_file_path);
  check(result.error);
  if (!result.data) throw new ApiError(404, "Dokumen tidak tersedia.");
  return result.data;
}
