import type { Response } from "express";
export function ok(
  res: Response,
  data: unknown,
  message = "Berhasil",
  status = 200,
) {
  return res.status(status).json({ success: true, message, data });
}
