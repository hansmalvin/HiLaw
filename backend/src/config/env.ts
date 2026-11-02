import { config } from "dotenv";
import { fileURLToPath } from "node:url";
// Tests set their own variables; real keys in .env (Gemini, Midtrans) must not leak into them.
if (process.env.NODE_ENV !== "test")
  config({
    path: fileURLToPath(new URL("../../.env", import.meta.url)),
    quiet: true,
  });
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8001),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  FRONTEND_URL: z.url(),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Optional: without a key the chatbot uses its keyword fallback.
  GEMINI_API_KEY: z.string().trim().optional(),
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-3.5-flash-lite"),
  // Optional: with both Midtrans keys set, top up goes through Midtrans Snap instead of the simulation.
  MIDTRANS_SERVER_KEY: z.string().trim().optional(),
  MIDTRANS_CLIENT_KEY: z.string().trim().optional(),
  MIDTRANS_IS_PRODUCTION: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});
const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(
    "Environment belum valid: " +
      result.error.issues.map((i) => i.path.join(".")).join(", "),
  );
}
export const env = result.data;
