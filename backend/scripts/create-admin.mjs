import { config } from "dotenv";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
config({ path: new URL("../.env", import.meta.url), quiet: true });
// Default credentials requested for this coursework project.
const email = (process.env.HILAW_ADMIN_EMAIL || "admin@gmail.com")
  .trim()
  .toLowerCase();
const password = process.env.HILAW_ADMIN_PASSWORD || "hilaw123";
if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
  throw new Error("Konfigurasi email/password admin tidak valid.");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  options,
);
const existing = await db
  .from("profiles")
  .select("id,role")
  .eq("email", email)
  .maybeSingle();
if (existing.error) throw new Error("Gagal memeriksa profil admin.");
let id;
let created = false;
if (existing.data) {
  if (existing.data.role !== "admin")
    throw new Error(
      "Email dipakai akun non-admin. Akun tersebut tidak diubah.",
    );
  id = existing.data.id;
  const updated = await db.auth.admin.updateUserById(id, {
    password,
    email_confirm: true,
  });
  if (updated.error)
    throw new Error(
      "Gagal memperbarui password admin. Periksa kebijakan password Supabase.",
    );
} else {
  const result = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin HiLaw", role: "customer", phone: "" },
  });
  if (result.error || !result.data.user)
    throw new Error(
      "Gagal membuat akun. Email mungkin sudah tersedia di Auth.",
    );
  id = result.data.user.id;
  const promoted = await db
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", id)
    .eq("role", "customer")
    .select("role")
    .single();
  if (promoted.error || promoted.data?.role !== "admin") {
    const rollback = await db.auth.admin.deleteUser(id);
    throw new Error(
      rollback.error
        ? "Promosi dan cleanup gagal. Periksa akun baru di Supabase."
        : "Promosi gagal; akun baru dibatalkan.",
    );
  }
  created = true;
}
const auth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  options,
);
let login = await auth.auth.signInWithPassword({ email, password });
for (
  let attempt = 0;
  login.error?.code === "invalid_credentials" && attempt < 3;
  attempt++
) {
  await delay(300 * (attempt + 1));
  login = await auth.auth.signInWithPassword({ email, password });
}
if (login.error || !login.data.session)
  throw new Error("Akun diperbarui tetapi login Supabase gagal.");
const stored = await db
  .from("profiles")
  .select("role,email")
  .eq("id", id)
  .single();
if (stored.error || stored.data.role !== "admin")
  throw new Error("Role admin belum sesuai.");
let apiVerified = false;
try {
  const base = `http://localhost:${process.env.PORT || 8001}/api`;
  const response = await fetch(base + "/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (response.ok && result.data?.profile.role === "admin") {
    const headers = {
      Authorization: "Bearer " + result.data.session.access_token,
    };
    const access = await fetch(base + "/admin/verifications?limit=1", {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    apiVerified = access.ok;
    await fetch(base + "/auth/signout", { method: "POST", headers });
  }
} finally {
  await auth.auth.signOut({ scope: "local" });
}
console.log(
  JSON.stringify({
    created,
    updated: !created,
    email,
    role: "admin",
    supabaseLoginVerified: true,
    adminApiVerified: apiVerified,
  }),
);
