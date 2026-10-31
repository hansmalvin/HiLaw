import multer from "multer";
import { ApiError } from "../utils/errors.js";
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 5, fieldSize: 4096 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype))
      return cb(new ApiError(400, "KTA harus JPG, PNG, atau PDF."));
    cb(null, true);
  },
}).single("kta_file");

export const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype))
      return cb(new ApiError(400, "Foto profil harus JPG atau PNG."));
    cb(null, true);
  },
}).single("avatar");
