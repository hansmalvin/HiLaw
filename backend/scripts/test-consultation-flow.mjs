// Live end-to-end check against the running backend (npm run dev --prefix backend) and Supabase.
// Creates a temporary customer + lawyer with fictional emails and deletes both at the end.
// Needs migrations 004 + 005. Run: node backend/scripts/test-consultation-flow.mjs
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
config({ path: new URL("../.env", import.meta.url), quiet: true });
const base = `http://localhost:${process.env.PORT || 8001}/api`;
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const created = [];
const check = (ok, label) => {
  if (!ok) throw new Error("GAGAL: " + label);
  console.log("✔ " + label);
};
async function call(token, method, path, body) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${json.message}`);
  return json.data;
}
async function account(role) {
  const email = `e2e-${role}-${randomUUID().slice(0, 8)}@example.com`;
  const password = "E2eTest-" + randomUUID();
  const data = await call(null, "POST", "/auth/signup", {
    full_name: "E2E " + role,
    email,
    password,
    confirm_password: password,
    role,
  });
  created.push(data.profile.id);
  return { id: data.profile.id, token: data.session.access_token };
}

try {
  const customer = await account("customer");
  const lawyer = await account("lawyer");
  // Fixture shortcut: approve the temporary lawyer directly instead of uploading a KTA.
  const approved = await db
    .from("lawyer_profiles")
    .update({ verification_status: "approved", rate_points: 35, specialization: "Hukum Perdata" })
    .eq("user_id", lawyer.id)
    .select("id")
    .single();
  if (approved.error) throw approved.error;
  const lawyerId = approved.data.id;

  // Fixture: credit through the same SQL function the simulated top up uses, so this
  // script also works when Midtrans is configured (simulated top up is then disabled).
  const topup = await db.rpc("topup_points", {
    p_user_id: customer.id,
    p_amount: 100,
    p_method: "QRIS",
    p_request_id: randomUUID(),
  });
  if (topup.error) throw topup.error;
  const wallet = await call(customer.token, "GET", "/wallet");
  check(wallet.balance === 100, "saldo 100 Poin tersimpan di server");

  const request = randomUUID();
  const booking = { lawyer_id: lawyerId, brief: "Teman meminjam uang dan belum membayar.", request_id: request, duration_minutes: 15 };
  const { id } = await call(customer.token, "POST", "/consultations", booking);
  const retry = await call(customer.token, "POST", "/consultations", booking);
  check(retry.id === id, "pesan ulang dengan request_id sama tidak membuat konsultasi kedua");
  check((await call(customer.token, "GET", "/wallet")).balance === 79, "paket Kilat 15 menit memotong ceil(35 x 60%) = 21 Poin sekali");

  const lawyerList = await call(lawyer.token, "GET", "/consultations");
  check(lawyerList.some((c) => c.id === id && c.status === "Pending"), "permintaan muncul di dashboard pengacara");
  await call(lawyer.token, "PATCH", `/consultations/${id}/status`, { status: "Confirmed" });
  await call(lawyer.token, "PATCH", `/consultations/${id}/status`, { status: "Ongoing" });

  await call(customer.token, "POST", `/consultations/${id}/messages`, { id: randomUUID(), body: "Halo, saya customer." });
  const thread = await call(lawyer.token, "POST", `/consultations/${id}/messages`, { id: randomUUID(), body: "Halo, saya pengacara." });
  check(thread.items.length === 2, "chat dua arah: pengacara melihat pesan customer");
  const seen = await call(customer.token, "GET", `/consultations/${id}/messages`);
  check(seen.items.map((m) => m.sender_name).join("|") === "E2E customer|E2E lawyer", "customer melihat balasan pengacara");

  // Simulate the 15 minutes passing, then let a normal read end the session.
  await db.from("consultations").update({ started_at: new Date(Date.now() - 16 * 60000).toISOString() }).eq("id", id);
  const after = await call(customer.token, "GET", `/consultations/${id}/messages`);
  check(after.status === "Completed", "sesi berakhir otomatis setelah 15 menit");
  let blocked = false;
  try {
    await call(customer.token, "POST", `/consultations/${id}/messages`, { id: randomUUID(), body: "Masih bisa?" });
  } catch {
    blocked = true;
  }
  check(blocked, "pesan ditolak setelah waktu habis");
  check((await call(lawyer.token, "GET", "/wallet")).balance === 17, "pengacara menerima 21 - floor(21/5) = 17 Poin");

  const reviewed = await call(customer.token, "POST", `/consultations/${id}/review`, { rating: 5 });
  check(reviewed.review?.rating === 5 && reviewed.review.body === null, "ulasan bintang tanpa teks diterima");
  const reviews = await call(null, "GET", `/lawyers/${lawyerId}/reviews`);
  check(reviews.length === 1, "ulasan tampil di profil publik pengacara");
  console.log("\nSEMUA ALUR BERHASIL");
} catch (error) {
  console.error(error.message);
  if (/book_consultation|p_duration|502/.test(error.message))
    console.error("Kemungkinan migration 005 belum dijalankan di Supabase SQL Editor.");
  process.exitCode = 1;
} finally {
  for (const id of created) await db.auth.admin.deleteUser(id);
  console.log(`Cleanup: ${created.length} akun uji dihapus.`);
}
