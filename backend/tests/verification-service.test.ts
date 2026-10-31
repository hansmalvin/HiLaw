import test from "node:test";
import assert from "node:assert/strict";
import type { Profile } from "../src/types/index.js";
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_ANON_KEY = "test-anon-not-a-credential";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-not-a-credential";
const nativeFetch = globalThis.fetch;
const actor: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
  full_name: "Nama Demo",
  email: "demo@example.com",
  phone: null,
  role: "lawyer",
  avatar_url: null,
};
let rpcFails = false;
let owner = actor.id;
let uploadedPath = "";
let removed: string[] = [];
let rpcBody: Record<string, unknown> = {};
let downloads = 0;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (
    url.includes("/storage/v1/object/lawyer-kta/") &&
    init?.method === "POST"
  ) {
    uploadedPath = url.split("/object/lawyer-kta/")[1]!;
    return Response.json({
      Key: "lawyer-kta/" + uploadedPath,
      Id: "test-file",
    });
  }
  if (
    url.endsWith("/storage/v1/object/lawyer-kta") &&
    init?.method === "DELETE"
  ) {
    removed = JSON.parse(String(init.body)).prefixes;
    return Response.json([]);
  }
  if (url.includes("/rest/v1/rpc/")) {
    rpcBody = JSON.parse(String(init?.body));
    return rpcFails
      ? Response.json(
          { code: "P0001", message: "Pengajuan sudah diproses" },
          { status: 400 },
        )
      : Response.json({ id: "application", status: "pending" });
  }
  if (url.includes("/rest/v1/lawyer_verifications"))
    return Response.json({
      id: "application",
      lawyer_id: "lawyer",
      kta_file_path: "owner/demo.pdf",
    });
  if (url.includes("/rest/v1/lawyer_profiles"))
    return Response.json({ user_id: owner });
  if (url.includes("/storage/v1/object/")) {
    downloads++;
    return new Response("%PDF-1.7 demo", {
      headers: { "Content-Type": "application/pdf" },
    });
  }
  throw new Error("Unexpected upstream service request: " + url);
};
const { submitVerification, document, reviewVerification } =
  await import("../src/services/verification.js");
const file = {
  buffer: Buffer.from("%PDF-1.7 demo"),
  mimetype: "application/pdf",
  originalname: "../../untrusted.pdf",
} as Express.Multer.File;
test("verification services keep ownership, private upload, and rollback behavior", async (t) => {
  try {
    await t.test(
      "upload uses unique actor-owned path, not original filename",
      async () => {
        await submitVerification(
          actor,
          { full_name: "Nama Demo" },
          file,
          false,
        );
        assert.match(
          uploadedPath,
          new RegExp("^" + actor.id + "/[a-f0-9-]+\\.pdf$"),
        );
        assert.equal(uploadedPath.includes("untrusted"), false);
        assert.equal(rpcBody.p_user_id, actor.id);
        assert.equal(rpcBody.p_resubmit, false);
      },
    );
    await t.test(
      "failed SQL submission removes uploaded object and returns conflict",
      async () => {
        rpcFails = true;
        await assert.rejects(submitVerification(actor, {}, file, true), {
          status: 409,
        });
        assert.deepEqual(removed, [uploadedPath]);
        assert.equal(rpcBody.p_resubmit, true);
        rpcFails = false;
      },
    );
    await t.test("missing or spoofed document is rejected", async () => {
      await assert.rejects(submitVerification(actor, {}, undefined, false), {
        status: 400,
      });
      await assert.rejects(
        submitVerification(
          actor,
          {},
          { ...file, buffer: Buffer.from("<script>") },
          false,
        ),
        { status: 400 },
      );
    });
    await t.test("foreign owner denied before Storage download", async () => {
      owner = "foreign-user";
      const before = downloads;
      await assert.rejects(document(actor, "application"), { status: 403 });
      assert.equal(downloads, before);
    });
    await t.test("owner and Admin may download private document", async () => {
      owner = actor.id;
      assert.equal(
        (await document(actor, "application")).type,
        "application/pdf",
      );
      assert.equal(
        (await document({ ...actor, role: "admin" }, "application")).type,
        "application/pdf",
      );
    });
    await t.test(
      "review delegates atomic decision with validated actor id",
      async () => {
        await reviewVerification(
          { ...actor, role: "admin" },
          "application",
          "rejected",
          "Data belum sesuai",
        );
        assert.equal(rpcBody.p_admin_id, actor.id);
        assert.equal(rpcBody.p_verification_id, "application");
        assert.equal(rpcBody.p_decision, "rejected");
        assert.equal(rpcBody.p_reason, "Data belum sesuai");
      },
    );
  } finally {
    globalThis.fetch = nativeFetch;
  }
});
