import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: new URL("../.env", import.meta.url), quiet: true });
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const name = "profile-avatars";
const options = {
  public: true,
  fileSizeLimit: 2097152,
  allowedMimeTypes: ["image/jpeg", "image/png"],
};
const existing = await db.storage.getBucket(name);
if (
  existing.error &&
  !["404", "400"].includes(String(existing.error.statusCode))
)
  throw new Error("Tidak dapat memeriksa bucket avatar.");
const result = existing.data
  ? await db.storage.updateBucket(name, options)
  : await db.storage.createBucket(name, options);
if (result.error) throw new Error("Konfigurasi bucket avatar gagal.");
console.log("Profile avatar bucket ready (JPG/PNG, max 2 MB)");
