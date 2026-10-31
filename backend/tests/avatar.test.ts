import test from "node:test";
import assert from "node:assert/strict";
import type { Profile } from "../src/types/index.js";
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_ANON_KEY = "test-anon-not-a-credential";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-not-a-credential";
const native = globalThis.fetch;
const id = "11111111-1111-4111-8111-111111111111";
const actor: Profile = {
  id,
  full_name: "Customer",
  email: null,
  phone: null,
  role: "customer",
  avatar_url: `https://supabase.test/storage/v1/object/public/profile-avatars/${id}/previous.png`,
};
let path = "",
  rpcFails = false,
  patch: Record<string, any> = {};
const removed: string[] = [];
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (
    url.includes("/storage/v1/object/profile-avatars/") &&
    init?.method === "POST"
  ) {
    path = url.split("/object/profile-avatars/")[1]!;
    return Response.json({ Key: path });
  }
  if (
    url.endsWith("/storage/v1/object/profile-avatars") &&
    init?.method === "DELETE"
  ) {
    removed.push(...JSON.parse(String(init.body)).prefixes);
    return Response.json([]);
  }
  if (url.endsWith("/rest/v1/rpc/update_own_profile")) {
    patch = JSON.parse(String(init?.body));
    return rpcFails
      ? Response.json(
          { code: "P0001", message: "Profile update failed" },
          { status: 400 },
        )
      : Response.json(null);
  }
  throw new Error("Unexpected request");
};
const { uploadAvatar, removeOwnedAvatar } =
  await import("../src/services/avatar.js");
const file = {
  buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  size: 8,
  mimetype: "image/png",
  originalname: "../../evil.png",
} as Express.Multer.File;
test("avatar uploads validate images, ownership and rollback", async (t) => {
  try {
    await t.test(
      "generated owned path saved through profile RPC and old image removed",
      async () => {
        await uploadAvatar(actor, file);
        assert.ok(path.startsWith(id + "/"));
        assert.equal(path.includes("evil"), false);
        assert.equal(patch.p_user_id, id);
        assert.ok(patch.p_patch.avatar_url.endsWith(path));
        assert.ok(removed.includes(id + "/previous.png"));
      },
    );
    await t.test(
      "Lawyer can upload their own photo without changing verification data",
      async () => {
        await uploadAvatar({ ...actor, role: "lawyer" }, file);
        assert.equal(patch.p_user_id, id);
        assert.deepEqual(Object.keys(patch.p_patch), ["avatar_url"]);
      },
    );
    await t.test(
      "failed database update removes new uploaded image",
      async () => {
        rpcFails = true;
        await assert.rejects(uploadAvatar(actor, file), { status: 409 });
        assert.ok(removed.includes(path));
        rpcFails = false;
      },
    );
    await t.test(
      "documents, oversized photos and other roles rejected",
      async () => {
        await assert.rejects(uploadAvatar({ ...actor, role: "admin" }, file), {
          status: 403,
        });
        await assert.rejects(
          uploadAvatar(actor, { ...file, mimetype: "application/pdf" }),
          { status: 400 },
        );
        await assert.rejects(
          uploadAvatar(actor, { ...file, size: 3 * 1024 * 1024 }),
          { status: 400 },
        );
        await assert.rejects(
          uploadAvatar(actor, { ...file, buffer: Buffer.from("not an image") }),
          { status: 400 },
        );
      },
    );
    await t.test("cleanup never deletes a different user's file", async () => {
      const before = removed.length;
      await removeOwnedAvatar(
        id,
        "https://supabase.test/storage/v1/object/public/profile-avatars/foreign-user/photo.png",
      );
      assert.equal(removed.length, before);
    });
  } finally {
    globalThis.fetch = native;
  }
});
