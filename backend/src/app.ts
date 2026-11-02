import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { routes } from "./routes/index.js";
import { errorHandler } from "./middlewares/errors.js";
import { ApiError } from "./utils/errors.js";
export const app = express();
app.disable("x-powered-by");
// Vercel sits one proxy hop in front; without this every visitor shares one rate-limit bucket.
if (process.env.VERCEL) app.set("trust proxy", 1);
// Vercel's type check resolves helmet to its CommonJS typings and sees the module object, but at
// runtime the default import is the middleware factory, so only the type needs the cast.
app.use((helmet as unknown as () => express.RequestHandler)());
app.use(
  cors({
    origin: (origin, cb) =>
      cb(null, !origin || origin === new URL(env.FRONTEND_URL).origin),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);
app.use(
  rateLimit({
    windowMs: 60_000,
    // Per IP, so it must fit several signed-in users behind one address (a demo laptop, campus NAT):
    // each open chat room polls ~36 requests/min, and 120 locked every account out after 3–4 rooms.
    limit: 600,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Terlalu banyak request." },
  }),
);
app.use(express.json({ limit: "512kb" }));
app.use(
  "/api",
  (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  routes,
);
app.use((_req, _res, next) =>
  next(new ApiError(404, "Endpoint tidak ditemukan.")),
);
app.use(errorHandler);
// Vercel runs this module as a Function and needs the app as the default export.
export default app;
