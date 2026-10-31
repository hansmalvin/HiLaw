import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: new URL("../.env", import.meta.url), quiet: true });
let input = "";
for await (const chunk of process.stdin) input += chunk;
const { email, password } = JSON.parse(input);
if (
  typeof email !== "string" ||
  !/^\S+@\S+\.\S+$/.test(email) ||
  typeof password !== "string" ||
  password.length < 8
)
  throw new Error("Email atau password tidak valid.");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  options,
);
const lookup = await db
  .from("profiles")
  .select("id,email,role")
  .eq("email", "admin.hilaw@example.com")
  .maybeSingle();
if (lookup.error) throw new Error("Gagal memeriksa admin.");
const target = await db
  .from("profiles")
  .select("id,email,role")
  .eq("email", email)
  .maybeSingle();
if (target.error) throw new Error("Gagal memeriksa email tujuan.");
const account = lookup.data ?? target.data;
if (!account || account.role !== "admin")
  throw new Error("Akun admin tidak ditemukan.");
if (target.data && target.data.id !== account.id)
  throw new Error(
    "Email tujuan sudah dipakai akun lain. Tidak ada akun yang ditimpa.",
  );
const changed = await db.auth.admin.updateUserById(account.id, {
  email,
  password,
  email_confirm: true,
});
if (changed.error)
  throw new Error(
    "Perubahan kredensial gagal. Periksa kebijakan password Supabase atau duplikasi email.",
  );
const profile = await db
  .from("profiles")
  .select("email,role")
  .eq("id", account.id)
  .single();
if (
  profile.error ||
  profile.data.email !== email ||
  profile.data.role !== "admin"
)
  throw new Error(
    "Identitas Auth berubah tetapi sinkronisasi profil perlu diperiksa.",
  );
const base = `http://localhost:${process.env.PORT || 8001}/api`;
const login = await fetch(base + "/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const result = await login.json();
if (!login.ok || result.data?.profile.role !== "admin")
  throw new Error(
    "Kredensial berubah tetapi pengujian login API belum berhasil.",
  );
const headers = { Authorization: "Bearer " + result.data.session.access_token };
const access = await fetch(base + "/admin/verifications?limit=1", { headers });
await fetch(base + "/auth/signout", { method: "POST", headers });
if (!access.ok)
  throw new Error("Login berhasil tetapi akses admin perlu diperiksa.");
console.log(
  JSON.stringify({
    updated: true,
    email,
    role: "admin",
    loginVerified: true,
    adminApiVerified: true,
  }),
);
