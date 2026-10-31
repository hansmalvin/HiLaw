import test from "node:test";
import assert from "node:assert/strict";
import type { Profile } from "../src/types/index.js";
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_ANON_KEY = "test-anon-not-a-credential";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-not-a-credential";
const original = globalThis.fetch;
const id = "11111111-1111-4111-8111-111111111111";
const admin: Profile = {
  id: "22222222-2222-4222-8222-222222222222",
  full_name: "Admin",
  role: "admin",
  email: null,
  phone: null,
  avatar_url: null,
};
let targetRole = "customer",
  absent = false,
  deletes = 0;
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  if (url.pathname === "/rest/v1/profiles") {
    if (url.searchParams.get("role") === "eq.customer")
      return Response.json(
        [
          {
            id,
            full_name: "Customer",
            email: "course@example.com",
            phone: null,
            created_at: "2026-10-31T01:00:00Z",
          },
        ],
        { headers: { "Content-Range": "0-0/1" } },
      );
    return Response.json(absent ? null : { id, role: targetRole });
  }
  if (url.pathname.includes("/auth/v1/admin/users/")) {
    if (init?.method === "DELETE") {
      deletes++;
      return Response.json({});
    }
    return Response.json({
      id,
      last_sign_in_at: "2026-10-31T02:00:00Z",
      user_metadata: { private: "must not be returned" },
    });
  }
  throw new Error("Unexpected upstream request");
};
const { listCustomers, deleteCustomer } =
  await import("../src/services/customers.js");
test("customer administration enforces role boundaries and returns only login metadata", async (t) => {
  try {
    await t.test(
      "list includes last sign-in without Auth user internals",
      async () => {
        const result = await listCustomers(admin, 1, 25);
        assert.equal(result.total, 1);
        assert.equal(result.items[0].last_sign_in_at, "2026-10-31T02:00:00Z");
        assert.equal("user_metadata" in result.items[0], false);
      },
    );
    await t.test("non-Admin cannot list or delete", async () => {
      await assert.rejects(
        listCustomers({ ...admin, role: "customer" }, 1, 25),
        { status: 403 },
      );
      await assert.rejects(deleteCustomer({ ...admin, role: "lawyer" }, id), {
        status: 403,
      });
    });
    await t.test(
      "Admin cannot delete self, other Admins, or Lawyers",
      async () => {
        await assert.rejects(deleteCustomer(admin, admin.id), { status: 403 });
        for (const value of ["admin", "lawyer"]) {
          targetRole = value;
          await assert.rejects(deleteCustomer(admin, id), { status: 403 });
        }
        assert.equal(deletes, 0);
      },
    );
    await t.test(
      "customer deletion uses Auth delete and missing rows return 404",
      async () => {
        targetRole = "customer";
        await deleteCustomer(admin, id);
        assert.equal(deletes, 1);
        absent = true;
        await assert.rejects(deleteCustomer(admin, id), { status: 404 });
        assert.equal(deletes, 1);
      },
    );
  } finally {
    globalThis.fetch = original;
  }
});
