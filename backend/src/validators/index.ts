import { z } from "zod";
export const organizations = [
  "PERADI",
  "KAI",
  "AAI",
  "IKADIN",
  "IPHI",
  "HAPI",
  "Lainnya",
] as const;
export const specializations = [
  "Hukum Pidana",
  "Hukum Perdata",
  "Hukum Keluarga",
  "Hukum Bisnis",
  "Hukum Properti",
  "Hukum Ketenagakerjaan",
  "Hukum Waris",
  "Konsultasi Umum",
] as const;
const fullName = z.string().trim().min(2).max(100);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{9,16}$/)
  .optional();
const email = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase());
export const signup = z
  .object({
    full_name: fullName,
    email,
    phone,
    password: z.string().min(8).max(128),
    confirm_password: z.string().min(8).max(128),
    role: z.enum(["customer", "lawyer"]),
  })
  .strict()
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Konfirmasi password belum sesuai.",
  });
export const signin = z
  .object({ email, password: z.string().min(1).max(128) })
  .strict();
export const refresh = z
  .object({ refresh_token: z.string().min(1).max(4096) })
  .strict();
export const profile = z
  .object({
    full_name: fullName.optional(),
    phone: z.union([z.literal(""), phone]).optional(),
    avatar_url: z
      .union([
        z
          .url()
          .max(2048)
          .refine((s) => s.startsWith("https://"), "Gunakan URL HTTPS"),
        z.null(),
      ])
      .optional(),
    bio: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((s) => Object.keys(s).length > 0, "Tidak ada perubahan");
export const verification = z
  .object({
    full_name: fullName,
    kta_number: z.string().trim().min(1).max(100),
    organization: z.enum(organizations),
    specialization: z.enum(specializations),
    experience_years: z.coerce.number().int().min(0).max(60),
  })
  .strict();
export const reject = z
  .object({ rejection_reason: z.string().trim().min(5).max(1000) })
  .strict();
export const deletion = z
  .object({
    confirmation: z.literal("DELETE"),
    password: z.string().min(1).max(128),
  })
  .strict();
export const id = z.uuid();
export const listQuery = z
  .object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const customerQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();
export const customerDeletion = z
  .object({ confirmation: z.literal("DELETE") })
  .strict();
