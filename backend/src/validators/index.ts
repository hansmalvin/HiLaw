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
    rate_points: z.number().int().min(1).max(10000).optional(),
    is_online: z.boolean().optional(),
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

const requestId = z.uuid();
export const topup = z
  .object({
    amount: z.union([
      z.literal(50),
      z.literal(100),
      z.literal(250),
      z.literal(500),
    ]),
    method: z.enum([
      "QRIS",
      "BCA Virtual Account",
      "Mandiri Virtual Account",
      "GoPay",
      "ShopeePay",
      "Kartu Kredit",
    ]),
    request_id: requestId,
  })
  .strict();
export const booking = z
  .object({
    lawyer_id: z.uuid(),
    brief: z.string().trim().min(10).max(1500),
    request_id: requestId,
    duration_minutes: z
      .union([z.literal(15), z.literal(30), z.literal(60)])
      .default(30),
  })
  .strict();
export const consultationStatus = z
  .object({
    status: z.enum(["Confirmed", "Ongoing", "Completed", "Cancelled"]),
  })
  .strict();
export const message = z
  .object({ id: z.uuid(), body: z.string().trim().min(1).max(2000) })
  .strict();
export const review = z
  .object({
    rating: z.number().int().min(1).max(5),
    // Optional text: an empty box is stored as no text.
    body: z.string().trim().max(1000).optional(),
  })
  .strict();
export const chatbot = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            text: z.string().trim().min(1).max(2000),
          })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();

export const midtransTopup = z
  .object({
    amount: z.union([
      z.literal(50),
      z.literal(100),
      z.literal(250),
      z.literal(500),
    ]),
  })
  .strict();
export const orderId = z.string().regex(/^HILAW-[A-Za-z0-9-]{1,44}$/);
// Midtrans sends many more fields; only the signed ones matter here.
export const midtransNotification = z.looseObject({
  order_id: z.string().min(1).max(50),
  status_code: z.string().min(1).max(10),
  gross_amount: z.string().min(1).max(20),
  signature_key: z.string().min(1).max(256),
});
