import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as c from "../controllers/index.js";
import { authenticate, roles } from "../middlewares/auth.js";
import { upload, uploadProfilePhoto } from "../middlewares/upload.js";
export const routes = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percobaan. Coba lagi nanti.",
  },
});
routes.get("/health", (_req, res) =>
  res.json({ success: true, message: "HiLaw API is running" }),
);
routes.post("/auth/signup", authLimit, c.signup);
routes.post("/auth/signin", authLimit, c.signin);
routes.post("/auth/refresh", authLimit, c.refresh);
routes.post("/auth/signout", authenticate, c.signout);
routes.get("/auth/me", authenticate, c.me);
routes.get("/lawyers", c.publicLawyers);
routes.get("/lawyers/:id/reviews", c.lawyerReviews);
// Each chatbot call may spend Gemini quota, so it gets its own tighter limit.
routes.post(
  "/chatbot",
  rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Terlalu banyak pertanyaan. Coba lagi sebentar lagi.",
    },
  }),
  c.chatbot,
);
routes.get("/profile/me", authenticate, c.me);
routes.put("/profile/me", authenticate, c.updateProfile);
routes.delete("/profile/me", authLimit, authenticate, c.deleteProfile);
routes.get(
  "/lawyer/verification",
  authenticate,
  roles("lawyer"),
  c.ownVerification,
);
routes.post(
  "/lawyer/verification",
  authenticate,
  roles("lawyer"),
  upload,
  c.submitVerification,
);
routes.put(
  "/lawyer/verification",
  authenticate,
  roles("lawyer"),
  upload,
  c.submitVerification,
);
routes.get(
  "/lawyer/verifications/:id/document",
  authenticate,
  roles("lawyer"),
  c.document,
);
routes.get(
  "/admin/verifications",
  authenticate,
  roles("admin"),
  c.listVerifications,
);
routes.get(
  "/admin/verifications/:id",
  authenticate,
  roles("admin"),
  c.verificationDetail,
);
routes.get(
  "/admin/verifications/:id/document",
  authenticate,
  roles("admin"),
  c.document,
);
routes.patch(
  "/admin/verifications/:id/approve",
  authenticate,
  roles("admin"),
  c.approve,
);
routes.patch(
  "/admin/verifications/:id/reject",
  authenticate,
  roles("admin"),
  c.reject,
);

routes.get("/admin/customers", authenticate, roles("admin"), c.listCustomers);
routes.delete(
  "/admin/customers/:id",
  authenticate,
  roles("admin"),
  c.deleteCustomer,
);

routes.post(
  "/profile/me/avatar",
  authenticate,
  roles("customer", "lawyer"),
  uploadProfilePhoto,
  c.updateAvatar,
);

routes.get("/wallet", authenticate, c.wallet);
routes.post("/wallet/topup", authenticate, roles("customer"), c.topUp);
routes.get("/payments/config", c.paymentConfig);
routes.post(
  "/wallet/topup/midtrans",
  authenticate,
  roles("customer"),
  c.midtransTopUp,
);
routes.get(
  "/wallet/topup/midtrans/:orderId",
  authenticate,
  roles("customer"),
  c.midtransStatus,
);
// Called by Midtrans servers; trust comes from the SHA-512 signature, not a login.
routes.post("/payments/midtrans/notification", c.midtransNotification);
routes.get("/consultations", authenticate, c.listConsultations);
routes.post("/consultations", authenticate, roles("customer"), c.book);
routes.get("/consultations/:id", authenticate, c.consultation);
routes.patch("/consultations/:id/status", authenticate, c.transition);
routes.get("/consultations/:id/messages", authenticate, c.messages);
routes.post("/consultations/:id/messages", authenticate, c.sendMessage);
routes.post(
  "/consultations/:id/review",
  authenticate,
  roles("customer"),
  c.review,
);
routes.get(
  "/admin/transactions",
  authenticate,
  roles("admin"),
  c.adminTransactions,
);
