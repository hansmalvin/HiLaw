import { config } from "dotenv";
import { fileURLToPath } from "node:url";
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
});
const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(
    "Environment belum valid: " +
      result.error.issues.map((i) => i.path.join(".")).join(", "),
  );
}
export const env = result.data;
