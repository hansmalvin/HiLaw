import { uploadAvatar } from "../services/avatar.js";
import * as customers from "../services/customers.js";
import * as consultations from "../services/consultations.js";
import { chat } from "../services/chatbot.js";
import * as midtrans from "../services/midtrans.js";
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
  if (
    req.actor!.role !== "lawyer" &&
    (input.bio !== undefined ||
      input.rate_points !== undefined ||
      input.is_online !== undefined)
  )
    throw new ApiError(
      400,
      "Bio, tarif, dan status online hanya untuk pengacara.",
    );
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

export const wallet: RequestHandler = async (req, res) => {
  ok(res, await consultations.wallet(req.actor!));
};
export const topUp: RequestHandler = async (req, res) => {
  // Free simulated points would bypass the real payment flow once Midtrans is on.
  if (midtrans.midtransEnabled())
    throw new ApiError(403, "Top up memakai Midtrans. Muat ulang halaman.");
  ok(
    res,
    await consultations.topUp(req.actor!, v.topup.parse(req.body)),
    "Top up berhasil.",
    201,
  );
};
export const listConsultations: RequestHandler = async (req, res) => {
  ok(res, await consultations.listConsultations(req.actor!));
};
export const book: RequestHandler = async (req, res) => {
  ok(
    res,
    await consultations.book(req.actor!, v.booking.parse(req.body)),
    "Pembayaran berhasil. Menunggu konfirmasi pengacara.",
    201,
  );
};
export const consultation: RequestHandler = async (req, res) => {
  ok(
    res,
    await consultations.consultation(req.actor!, v.id.parse(req.params.id)),
  );
};
export const transition: RequestHandler = async (req, res) => {
  ok(
    res,
    await consultations.transition(
      req.actor!,
      v.id.parse(req.params.id),
      v.consultationStatus.parse(req.body).status,
    ),
    "Status konsultasi diperbarui.",
  );
};
export const messages: RequestHandler = async (req, res) => {
  ok(res, await consultations.messages(req.actor!, v.id.parse(req.params.id)));
};
export const sendMessage: RequestHandler = async (req, res) => {
  ok(
    res,
    await consultations.sendMessage(
      req.actor!,
      v.id.parse(req.params.id),
      v.message.parse(req.body),
    ),
    "Pesan terkirim.",
    201,
  );
};
export const review: RequestHandler = async (req, res) => {
  ok(
    res,
    await consultations.review(
      req.actor!,
      v.id.parse(req.params.id),
      v.review.parse(req.body),
    ),
    "Terima kasih. Ulasan Anda telah tersimpan.",
    201,
  );
};
export const lawyerReviews: RequestHandler = async (req, res) => {
  ok(res, await consultations.lawyerReviews(v.id.parse(req.params.id)));
};
export const adminTransactions: RequestHandler = async (_req, res) => {
  ok(res, await consultations.adminTransactions());
};
export const chatbot: RequestHandler = async (req, res) => {
  ok(res, await chat(v.chatbot.parse(req.body).messages));
};

export const paymentConfig: RequestHandler = (_req, res) => {
  ok(res, midtrans.paymentConfig());
};
export const midtransTopUp: RequestHandler = async (req, res) => {
  ok(
    res,
    await midtrans.createTopUp(
      req.actor!,
      v.midtransTopup.parse(req.body).amount,
    ),
    "Order Midtrans dibuat.",
    201,
  );
};
export const midtransStatus: RequestHandler = async (req, res) => {
  ok(
    res,
    await midtrans.checkTopUp(req.actor!, v.orderId.parse(req.params.orderId)),
  );
};
export const midtransNotification: RequestHandler = async (req, res) => {
  await midtrans.notification(v.midtransNotification.parse(req.body));
  ok(res, null, "OK");
};
