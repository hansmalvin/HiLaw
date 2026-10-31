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
app.use(helmet());
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
    limit: 120,
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
