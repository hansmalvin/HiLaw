// Creates and removes only its own two temporary accounts.
import { randomUUID, randomBytes } from "node:crypto";
import { app } from "../dist/app.js";
import { database } from "../dist/config/supabase.js";
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const createdIds = [];
const password = randomBytes(20).toString("base64url") + "Aa1!";
async function create() {
  const response = await fetch(base + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Temporary Customer Management Test",
      email: `hilaw-customer-test-${randomUUID()}@example.com`,
      password,
      confirm_password: password,
      role: "customer",
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.data?.session)
    throw new Error("Temporary account signup failed");
  createdIds.push(result.data.profile.id);
  return result.data;
}
try {
  const customer = await create();
  const operator = await create();
  const promoted = await database
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", operator.profile.id);
  if (promoted.error) throw new Error("Temporary Admin promotion failed");
  const headers = {
    Authorization: "Bearer " + operator.session.access_token,
    "Content-Type": "application/json",
  };
  const list = await fetch(base + "/admin/customers?limit=50", { headers });
  const rows = await list.json();
  if (
    !list.ok ||
    !rows.data.items.some(
      (item) => item.id === customer.profile.id && item.last_sign_in_at,
    )
  )
    throw new Error("Customer login metadata missing");
  console.log(
    "PASS: Admin list contains customer and last login from Supabase",
  );
  const denied = await fetch(base + "/admin/customers", {
    headers: { Authorization: "Bearer " + customer.session.access_token },
  });
  if (denied.status !== 403) throw new Error("Customer accessed Admin list");
  console.log("PASS: Customer cannot access Admin list");
  const self = await fetch(base + "/admin/customers/" + operator.profile.id, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ confirmation: "DELETE" }),
  });
  if (self.status !== 403) throw new Error("Admin deletion allowed");
  const removed = await fetch(
    base + "/admin/customers/" + customer.profile.id,
    {
      method: "DELETE",
      headers,
      body: JSON.stringify({ confirmation: "DELETE" }),
    },
  );
  if (!removed.ok) throw new Error("Customer deletion failed");
  const profile = await database
    .from("profiles")
    .select("id")
    .eq("id", customer.profile.id)
    .maybeSingle();
  const auth = await database.auth.admin.getUserById(customer.profile.id);
  if (profile.error || profile.data || auth.data.user)
    throw new Error("Customer not fully removed");
  console.log("PASS: customer deleted from Auth and profiles; Admin protected");
  const revoked = await fetch(base + "/profile/me", {
    headers: { Authorization: "Bearer " + customer.session.access_token },
  });
  if (revoked.status !== 401)
    throw new Error("Deleted user still has API access");
  console.log("PASS: deleted customer session cannot access API");
} finally {
  for (const id of createdIds) {
    const stillExists = await database.auth.admin.getUserById(id);
    if (stillExists.data.user) {
      const removed = await database.auth.admin.deleteUser(id);
      if (removed.error) {
        process.exitCode = 1;
        console.error("Temporary account cleanup failed");
      }
    }
  }
  await new Promise((resolve) => server.close(resolve));
  console.log("Temporary test accounts cleaned up");
}
