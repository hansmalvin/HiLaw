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
