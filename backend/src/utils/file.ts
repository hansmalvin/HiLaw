import { ApiError } from "./errors.js";
export function fileExtension(buffer: Buffer, mime: string) {
  const png = buffer
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg =
    buffer.length >= 3 &&
    buffer[0] === 255 &&
    buffer[1] === 216 &&
    buffer[2] === 255;
  const pdf = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mime === "image/png" && png) return "png";
  if (mime === "image/jpeg" && jpg) return "jpg";
  if (mime === "application/pdf" && pdf) return "pdf";
  throw new ApiError(400, "Isi file tidak sesuai tipe JPG, PNG, atau PDF.");
}
