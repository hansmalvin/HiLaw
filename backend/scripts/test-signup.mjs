// Live smoke test: creates one temporary fictional account and always cleans it up.
import { randomUUID, randomBytes } from "node:crypto";
import { app } from "../dist/app.js";
import { database } from "../dist/config/supabase.js";
const email = `hilaw-test-${randomUUID()}@example.com`;
const password = randomBytes(24).toString("base64url") + "Aa1!";
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
let userId;
try {
  const request = {
    full_name: "HiLaw Temporary Coursework Test",
    email,
    password,
    confirm_password: password,
    role: "customer",
  };
  const response = await fetch(base + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const result = await response.json();
  if (response.status !== 201 || !result.data?.session)
    throw new Error(result.message || "Signup failed");
  userId = result.data.profile.id;
  const auth = await database.auth.admin.getUserById(userId);
  if (!auth.data.user?.email_confirmed_at)
    throw new Error("Account is not confirmed");
  console.log(
    "PASS: fictional email signup, immediate session, confirmed Auth account",
  );
  const stored = await database
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();
  if (stored.error) throw new Error("Profile was not persisted");
  console.log("PASS: profile persisted in Supabase");
  const mismatch = await fetch(base + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...request,
      confirm_password: "different-password",
    }),
  });
  if (mismatch.status !== 400)
    throw new Error("Mismatched confirmation accepted");
  console.log("PASS: mismatched password confirmation rejected");
  const signin = await fetch(base + "/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (signin.status !== 200) throw new Error("Sign In failed");
  console.log("PASS: Sign In without email link");
} finally {
  if (!userId) {
    const own = await database
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = own.data?.id;
  }
  if (userId) {
    const cleanup = await database.auth.admin.deleteUser(userId);
    if (cleanup.error) {
      process.exitCode = 1;
      console.error("Temporary test account cleanup failed");
    } else console.log("PASS: temporary test account removed");
  }
  await new Promise((resolve) => server.close(resolve));
}
