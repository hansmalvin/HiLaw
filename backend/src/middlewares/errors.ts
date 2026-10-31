import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { ApiError } from "../utils/errors.js";
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        success: false,
        message: "Periksa data yang dikirim.",
        errors: error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    return;
  }
  const status =
    error instanceof ApiError
      ? error.status
      : error instanceof multer.MulterError
        ? 400
        : error?.type === "entity.too.large"
          ? 413
          : error instanceof SyntaxError
            ? 400
            : 500;
  res
    .status(status)
    .json({
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : status === 400
            ? "Request tidak valid atau file melebihi 2 MB."
            : status === 413
              ? "Request terlalu besar."
              : "Terjadi kesalahan pada server.",
    });
};
