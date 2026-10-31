import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: new URL("../.env", import.meta.url), quiet: true });
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
let failed = false;
for (const table of ["profiles", "lawyer_profiles", "lawyer_verifications"]) {
  const result = await db
    .from(table)
    .select("id", { count: "exact", head: true });
  if (result.error) {
    failed = true;
    console.log(table + ": FAILED (" + (result.error.code ?? "network") + ")");
  } else console.log(table + ": OK, rows=" + result.count);
}
const bucket = await db.storage.getBucket("lawyer-kta");
console.log(
  "Private KTA bucket: " +
    (!bucket.error && bucket.data?.public === false
      ? "OK"
      : "MISSING OR INACCESSIBLE"),
);
if (failed) process.exitCode = 1;

const auth = await db.auth.admin.listUsers({ page: 1, perPage: 1 });
console.log(
  "Supabase Auth: " +
    (auth.error
      ? "INACCESSIBLE"
      : "OK, users=" + (auth.data.total ?? auth.data.users.length)),
);
