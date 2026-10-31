// Live smoke test: only creates/deletes its own temporary customer and avatar files.
import { randomUUID, randomBytes } from "node:crypto";
import { app } from "../dist/app.js";
import { database } from "../dist/config/supabase.js";
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const email = `hilaw-avatar-test-${randomUUID()}@example.com`;
const password = randomBytes(20).toString("base64url") + "Aa1!";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGUsAAAAASUVORK5CYII=",
  "base64",
);
const role = process.argv.includes("--lawyer") ? "lawyer" : "customer";
let id, token;
const paths = [];
try {
  const created = await fetch(base + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Temporary Avatar Test",
      email,
      password,
      confirm_password: password,
      role,
    }),
  });
  const account = await created.json();
  if (!created.ok || !account.data?.session)
    throw new Error("Temporary signup failed");
  id = account.data.profile.id;
  token = account.data.session.access_token;
  const headers = { Authorization: "Bearer " + token };
  let previous = null;
  for (let i = 0; i < 2; i++) {
    const body = new FormData();
    body.append("avatar", new Blob([png], { type: "image/png" }), "photo.png");
    const response = await fetch(base + "/profile/me/avatar", {
      method: "POST",
      headers,
      body,
    });
    const result = await response.json();
    if (!response.ok || !result.data?.avatar_url)
      throw new Error("Avatar upload failed: " + result.message);
    if (
      role === "lawyer" &&
      result.data.lawyer_profile?.verification_status !== "not_submitted"
    )
      throw new Error("Avatar upload changed lawyer verification status");
    const url = result.data.avatar_url;
    const path = url.split("/profile-avatars/")[1];
    paths.push(path);
    if (!path.startsWith(id + "/"))
      throw new Error("Avatar was not saved in owned folder");
    const publicPhoto = await fetch(url);
    if (
      !publicPhoto.ok ||
      Buffer.compare(Buffer.from(await publicPhoto.arrayBuffer()), png) !== 0
    )
      throw new Error("Stored image differs");
    const restored = await fetch(base + "/profile/me", { headers });
    if ((await restored.json()).data.avatar_url !== url)
      throw new Error("Photo did not persist");
    if (previous) {
      const removed = await database.storage
        .from("profile-avatars")
        .download(previous);
      if (!removed.error) throw new Error("Old avatar was not removed");
    }
    previous = path;
  }
  console.log(
    "PASS: upload, public photo bytes, profile persistence, replacement, and old-file cleanup",
  );
  const invalid = new FormData();
  invalid.append(
    "avatar",
    new Blob(["%PDF-1.7"], { type: "application/pdf" }),
    "document.pdf",
  );
  const rejected = await fetch(base + "/profile/me/avatar", {
    method: "POST",
    headers,
    body: invalid,
  });
  if (rejected.status !== 400)
    throw new Error("PDF incorrectly accepted as avatar");
  console.log("PASS: non-image upload rejected");
  const deleted = await fetch(base + "/profile/me", {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation: "DELETE", password }),
  });
  if (!deleted.ok) throw new Error("Test profile cleanup failed");
  const leftover = await database.storage
    .from("profile-avatars")
    .download(previous);
  if (!leftover.error)
    throw new Error("Avatar not cleaned up after account deletion");
  console.log("PASS: account deletion also removes its avatar");
} finally {
  if (!id) {
    const row = await database
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    id = row.data?.id;
  }
  if (paths.length)
    await database.storage.from("profile-avatars").remove(paths);
  if (id) {
    const account = await database.auth.admin.getUserById(id);
    if (account.data.user) {
      const removed = await database.auth.admin.deleteUser(id);
      if (removed.error) {
        process.exitCode = 1;
        console.error("Temporary account cleanup failed");
      }
    }
  }
  await new Promise((resolve) => server.close(resolve));
  console.log("Temporary account and files cleaned up");
}
