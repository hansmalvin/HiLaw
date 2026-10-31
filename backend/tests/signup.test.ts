import test from "node:test";
import assert from "node:assert/strict";
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_ANON_KEY = "test-anon-not-a-credential";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-not-a-credential";
const original = globalThis.fetch;
const id = "11111111-1111-4111-8111-111111111111";
const calls: { url: string; body: Record<string, unknown> }[] = [];
let duplicate = false;
let loginFails = false;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  calls.push({ url, body });
  if (url.endsWith("/auth/v1/admin/users"))
    return duplicate
      ? Response.json(
          { code: "email_exists", msg: "already exists" },
          { status: 422, headers: { "X-Supabase-Api-Version": "2024-01-01" } },
        )
      : Response.json({ id, email: "course@example.com" });
  if (url.includes("/auth/v1/token"))
    return loginFails
      ? Response.json({ msg: "login unavailable" }, { status: 500 })
      : Response.json({
          access_token: "test-access",
          refresh_token: "test-refresh",
          token_type: "bearer",
          expires_in: 3600,
          user: { id, email: "course@example.com" },
        });
  if (url.includes("/rest/v1/profiles"))
    return Response.json({
      id,
      full_name: "Course User",
      role: "customer",
      email: "course@example.com",
    });
  throw new Error("Unexpected Auth request");
};
const { signUp } = await import("../src/services/auth.js");
const input = {
  full_name: "Course User",
  email: "course@example.com",
  password: "CoursePass123!",
  confirm_password: "CoursePass123!",
  role: "customer" as const,
};
test("coursework registration confirms server-side without email delivery", async (t) => {
  try {
    await t.test(
      "creates confirmed Auth account and immediately returns a login session",
      async () => {
        const result = await signUp(input);
        assert.equal(result.email_confirmation_required, false);
        assert.equal(result.session.access_token, "test-access");
        assert.equal(result.profile.id, id);
        const create = calls.find((c) =>
          c.url.endsWith("/auth/v1/admin/users"),
        )!;
        assert.equal(create.body.email_confirm, true);
        assert.equal(create.body.confirm_password, undefined);
        assert.equal(
          (create.body.user_metadata as Record<string, unknown>).password,
          undefined,
        );
        assert.equal(
          calls.some((c) => c.url.includes("/auth/v1/signup")),
          false,
        );
      },
    );
    await t.test(
      "duplicate email cannot overwrite an existing account",
      async () => {
        duplicate = true;
        await assert.rejects(signUp(input), { status: 409 });
        duplicate = false;
      },
    );
    await t.test(
      "automatic login failure explains that the account was already created",
      async () => {
        loginFails = true;
        await assert.rejects(signUp(input), /Akun berhasil dibuat/);
      },
    );
  } finally {
    globalThis.fetch = original;
  }
});
