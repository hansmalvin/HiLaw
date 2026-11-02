import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { AddressInfo } from "node:net";
// Transport doubles only: no live Midtrans or Supabase calls.
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_ANON_KEY = "test-anon-not-a-credential";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-not-a-credential";
process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-test";
process.env.MIDTRANS_CLIENT_KEY = "SB-Mid-client-test";
const nativeFetch = globalThis.fetch;
const userId = "11111111-1111-4111-8111-111111111111";
const rpcCalls: { p_order_id: string; p_status: string }[] = [];
let snapBody: {
  transaction_details: { order_id: string; gross_amount: number };
} | null = null;
let snapAuth = "";
let midtransStatus = {
  status_code: "200",
  transaction_status: "settlement",
  payment_type: "qris",
};
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url === "https://app.sandbox.midtrans.com/snap/v1/transactions") {
    snapAuth = new Headers(init?.headers).get("authorization") ?? "";
    snapBody = JSON.parse(String(init?.body));
    return Response.json(
      { token: "snap-token", redirect_url: "https://snap.test" },
      { status: 201 },
    );
  }
  if (url.startsWith("https://api.sandbox.midtrans.com/v2/"))
    return Response.json(midtransStatus);
  if (!url.startsWith("https://supabase.test/"))
    return nativeFetch(input, init);
  if (url.includes("/auth/v1/user"))
    return Response.json({
      id: userId,
      aud: "authenticated",
      role: "authenticated",
    });
  if (url.includes("/rest/v1/profiles"))
    return Response.json({
      id: userId,
      full_name: "Nama Demo",
      email: "demo@example.com",
      phone: null,
      role: "customer",
      avatar_url: null,
    });
  if (url.includes("/rest/v1/topup_orders") && init?.method === "POST")
    return new Response(null, { status: 201 });
  if (url.includes("/rest/v1/topup_orders"))
    return Response.json({ order_id: "HILAW-1-abc" });
  if (url.includes("/rpc/settle_topup_order")) {
    rpcCalls.push(JSON.parse(String(init?.body)));
    return Response.json({ status: rpcCalls.at(-1)!.p_status, amount: 100 });
  }
  throw new Error("Unexpected request: " + url);
};
const { mapStatus, validSignature } =
  await import("../src/services/midtrans.js");
const { app } = await import("../src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
const auth = {
  Authorization: "Bearer token",
  "Content-Type": "application/json",
};
const sign = (order: string, code: string, gross: string) =>
  createHash("sha512")
    .update(order + code + gross + "SB-Mid-server-test")
    .digest("hex");

test("success needs settlement, or capture with an accepted fraud check", () => {
  assert.equal(mapStatus({ transaction_status: "settlement" }), "settlement");
  assert.equal(
    mapStatus({ transaction_status: "capture", fraud_status: "accept" }),
    "settlement",
  );
  assert.equal(mapStatus({ transaction_status: "capture" }), "settlement");
  assert.equal(
    mapStatus({ transaction_status: "capture", fraud_status: "challenge" }),
    "pending",
  );
  assert.equal(mapStatus({ transaction_status: "expire" }), "expire");
  assert.equal(mapStatus({ transaction_status: "refund" }), "pending");
});

test("signature check accepts Midtrans' SHA-512 and rejects tampering", () => {
  const n = {
    order_id: "HILAW-1-abc",
    status_code: "200",
    gross_amount: "100000.00",
  };
  assert.ok(
    validSignature({
      ...n,
      signature_key: sign(n.order_id, n.status_code, n.gross_amount),
    }),
  );
  assert.ok(
    !validSignature({
      ...n,
      gross_amount: "999000.00",
      signature_key: sign(n.order_id, n.status_code, n.gross_amount),
    }),
  );
  assert.ok(!validSignature({ ...n, signature_key: "short" }));
});

test("Midtrans HTTP flow: config, Snap order, forged and genuine notifications, simulation off", async () => {
  try {
    const config = await (await fetch(base + "/payments/config")).json();
    assert.deepEqual(config.data, {
      midtrans: true,
      client_key: "SB-Mid-client-test",
      snap_url: "https://app.sandbox.midtrans.com/snap/snap.js",
      sandbox: true,
    });

    const created = await fetch(base + "/wallet/topup/midtrans", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ amount: 100 }),
    });
    assert.equal(created.status, 201);
    assert.equal((await created.json()).data.token, "snap-token");
    assert.equal(snapBody!.transaction_details.gross_amount, 100000);
    assert.match(
      snapBody!.transaction_details.order_id,
      /^HILAW-\d+-[0-9a-f]{8}$/,
    );
    assert.equal(
      snapAuth,
      "Basic " + Buffer.from("SB-Mid-server-test:").toString("base64"),
    );

    const bad = await fetch(base + "/wallet/topup/midtrans", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ amount: 99 }),
    });
    assert.equal(bad.status, 400);

    const notify = (body: object) =>
      fetch(base + "/payments/midtrans/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    const n = {
      order_id: "HILAW-1-abc",
      status_code: "200",
      gross_amount: "100000.00",
      transaction_status: "settlement",
    };
    assert.equal(
      (await notify({ ...n, signature_key: "0".repeat(128) })).status,
      403,
    );
    assert.equal(
      rpcCalls.length,
      0,
      "forged notification must not touch the ledger",
    );
    assert.equal(
      (
        await notify({
          ...n,
          signature_key: sign(n.order_id, n.status_code, n.gross_amount),
        })
      ).status,
      200,
    );
    assert.deepEqual(
      { order: rpcCalls[0].p_order_id, status: rpcCalls[0].p_status },
      { order: "HILAW-1-abc", status: "settlement" },
    );

    const simulated = await fetch(base + "/wallet/topup", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ amount: 100, method: "QRIS", request_id: userId }),
    });
    assert.equal(
      simulated.status,
      403,
      "free simulated points are disabled once Midtrans is configured",
    );
  } finally {
    server.close();
  }
});
