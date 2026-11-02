import test from "node:test";
import assert from "node:assert/strict";
import * as v from "../src/validators/index.js";
import {
  signup,
  profile,
  verification,
  reject,
  listQuery,
} from "../src/validators/index.js";
import { fileExtension } from "../src/utils/file.js";

test("public signup excludes admin and unknown fields", () => {
  const user = {
    full_name: "Nama Demo",
    email: "demo@example.com",
    password: "DemoPass123!",
    confirm_password: "DemoPass123!",
    role: "lawyer",
  };
  assert.equal(signup.parse(user).role, "lawyer");
  assert.equal(
    signup.safeParse({ ...user, confirm_password: "Different123!" }).success,
    false,
  );
  assert.equal(signup.safeParse({ ...user, role: "admin" }).success, false);
  assert.equal(signup.safeParse({ ...user, user_id: "other" }).success, false);
  assert.equal(signup.safeParse({ ...user, password: "short" }).success, false);
});
test("profile requests cannot promote roles or change email", () => {
  assert.equal(profile.safeParse({ role: "admin" }).success, false);
  assert.equal(
    profile.safeParse({ email: "other@example.com" }).success,
    false,
  );
  assert.equal(
    profile.safeParse({ avatar_url: "javascript:alert(1)" }).success,
    false,
  );
  assert.equal(profile.safeParse({ bio: "Profil demo" }).success, true);
});
test("verification accepts six form fields with server-owned status", () => {
  const input = {
    full_name: "Nama Demo",
    kta_number: "DEMO-01",
    organization: "PERADI",
    specialization: "Hukum Pidana",
    experience_years: "3",
  };
  assert.equal(verification.parse(input).experience_years, 3);
  for (const patch of [
    { status: "approved" },
    { user_id: "foreign" },
    { experience_years: -1 },
    { experience_years: 1.5 },
    { organization: "invalid" },
  ])
    assert.equal(verification.safeParse({ ...input, ...patch }).success, false);
});
test("reject reason and pagination are bounded", () => {
  assert.equal(reject.safeParse({ rejection_reason: "" }).success, false);
  assert.equal(listQuery.safeParse({ limit: 101 }).success, false);
  assert.equal(listQuery.parse({ status: "pending", page: "2" }).page, 2);
});
test("file content signatures must match allowed MIME", () => {
  assert.equal(
    fileExtension(Buffer.from("%PDF-1.7 demo"), "application/pdf"),
    "pdf",
  );
  assert.equal(
    fileExtension(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"),
    "png",
  );
  assert.equal(
    fileExtension(Buffer.from([255, 216, 255, 224]), "image/jpeg"),
    "jpg",
  );
  assert.throws(() =>
    fileExtension(Buffer.from("<script>bad</script>"), "image/png"),
  );
  assert.throws(() => fileExtension(Buffer.from("%PDF-1.7"), "image/jpeg"));
});

test("booking defaults to the 30-minute package and review text is optional", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const base = { lawyer_id: id, brief: "Kronologi singkat kasus.", request_id: id };
  assert.equal(v.booking.parse(base).duration_minutes, 30);
  assert.equal(v.booking.parse({ ...base, duration_minutes: 60 }).duration_minutes, 60);
  assert.throws(() => v.booking.parse({ ...base, duration_minutes: 45 }));
  assert.equal(v.review.parse({ rating: 5 }).body, undefined);
  assert.equal(v.review.parse({ rating: 4, body: "  " }).body, "");
  assert.throws(() => v.review.parse({ rating: 0 }));
});
