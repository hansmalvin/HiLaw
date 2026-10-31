import { uploadAvatar } from "../services/avatar.js";
import * as customers from "../services/customers.js";
import type { RequestHandler } from "express";
import * as v from "../validators/index.js";
import * as auth from "../services/auth.js";
import * as profiles from "../services/profile.js";
import * as verification from "../services/verification.js";
import { ok } from "../utils/response.js";
import { ApiError } from "../utils/errors.js";
export const signup: RequestHandler = async (req, res) => {
  const data = await auth.signUp(v.signup.parse(req.body));
  ok(res, data, "Akun berhasil dibuat tanpa verifikasi email.", 201);
};
export const signin: RequestHandler = async (req, res) => {
  ok(res, await auth.signIn(v.signin.parse(req.body)));
};
export const refresh: RequestHandler = async (req, res) => {
  ok(res, await auth.refreshSession(v.refresh.parse(req.body).refresh_token));
};
export const me: RequestHandler = async (req, res) => {
  ok(res, await auth.currentUser(req.actor!.id));
};
export const signout: RequestHandler = async (req, res) => {
  await auth.signOut(req.accessToken!);
  ok(res, null, "Sesi dicabut.");
};
export const updateProfile: RequestHandler = async (req, res) => {
  const input = v.profile.parse(req.body);
  if (input.bio !== undefined && req.actor!.role !== "lawyer")
    throw new ApiError(400, "Bio hanya untuk pengacara.");
  await profiles.updateProfile(req.actor!, input);
  ok(res, await auth.currentUser(req.actor!.id), "Profil diperbarui.");
};
export const deleteProfile: RequestHandler = async (req, res) => {
  const input = v.deletion.parse(req.body);
  await profiles.deleteProfile(req.actor!, input.password);
  ok(res, null, "Akun dihapus.");
};
export const publicLawyers: RequestHandler = async (_req, res) => {
  ok(res, await profiles.publicLawyers());
};
export const ownVerification: RequestHandler = async (req, res) => {
  ok(res, await verification.ownVerification(req.actor!));
};
export const submitVerification: RequestHandler = async (req, res) => {
  ok(
    res,
    await verification.submitVerification(
      req.actor!,
      v.verification.parse(req.body),
      req.file,
      req.method === "PUT",
    ),
    "Pengajuan dikirim.",
    201,
  );
};
export const listVerifications: RequestHandler = async (req, res) => {
  const q = v.listQuery.parse(req.query);
  ok(res, await verification.listVerifications(q.status, q.page, q.limit));
};
export const verificationDetail: RequestHandler = async (req, res) => {
  ok(res, await verification.verificationDetail(v.id.parse(req.params.id)));
};
export const approve: RequestHandler = async (req, res) => {
  ok(
    res,
    await verification.reviewVerification(
      req.actor!,
      v.id.parse(req.params.id),
      "approved",
    ),
  );
};
export const reject: RequestHandler = async (req, res) => {
  ok(
    res,
    await verification.reviewVerification(
      req.actor!,
      v.id.parse(req.params.id),
      "rejected",
      v.reject.parse(req.body).rejection_reason,
    ),
  );
};
export const document: RequestHandler = async (req, res) => {
  const file = await verification.document(
    req.actor!,
    v.id.parse(req.params.id),
  );
  res.set({
    "Content-Type": file.type,
    "Content-Disposition": "inline",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(Buffer.from(await file.arrayBuffer()));
};

export const listCustomers: RequestHandler = async (req, res) => {
  const query = v.customerQuery.parse(req.query);
  ok(res, await customers.listCustomers(req.actor!, query.page, query.limit));
};
export const deleteCustomer: RequestHandler = async (req, res) => {
  v.customerDeletion.parse(req.body);
  await customers.deleteCustomer(req.actor!, v.id.parse(req.params.id));
  ok(res, null, "Akun customer berhasil dihapus.");
};

export const updateAvatar: RequestHandler = async (req, res) => {
  await uploadAvatar(req.actor!, req.file);
  ok(
    res,
    await auth.currentUser(req.actor!.id),
    "Foto profil berhasil diperbarui.",
  );
};
