import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { database } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import type { Profile } from "../types/index.js";

const hosts = env.MIDTRANS_IS_PRODUCTION
  ? { app: "https://app.midtrans.com", api: "https://api.midtrans.com" }
  : {
      app: "https://app.sandbox.midtrans.com",
      api: "https://api.sandbox.midtrans.com",
    };
const headers = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization:
    "Basic " + Buffer.from(env.MIDTRANS_SERVER_KEY + ":").toString("base64"),
});
export const midtransEnabled = () =>
  !!(env.MIDTRANS_SERVER_KEY && env.MIDTRANS_CLIENT_KEY);

// Public: the client key and Snap URL are meant for the browser.
export function paymentConfig() {
  return midtransEnabled()
    ? {
        midtrans: true,
        client_key: env.MIDTRANS_CLIENT_KEY,
        snap_url: hosts.app + "/snap/snap.js",
        sandbox: !env.MIDTRANS_IS_PRODUCTION,
      }
    : { midtrans: false };
}

export async function createTopUp(actor: Profile, amount: number) {
  if (!midtransEnabled())
    throw new ApiError(503, "Pembayaran Midtrans belum dikonfigurasi.");
  const orderId = `HILAW-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const inserted = await database.from("topup_orders").insert({
    order_id: orderId,
    user_id: actor.id,
    amount,
    gross_amount: amount * 1000,
  });
  check(inserted.error);
  const response = await fetch(hosts.app + "/snap/v1/transactions", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: amount * 1000 },
      item_details: [
        {
          id: "poin-" + amount,
          price: amount * 1000,
          quantity: 1,
          name: amount + " Poin HiLaw",
        },
      ],
      customer_details: {
        first_name: actor.full_name,
        email: actor.email ?? undefined,
      },
      // Used by redirect-based methods (e.g. GoPay on mobile); Midtrans appends ?order_id=...
      callbacks: { finish: env.FRONTEND_URL + "/customer/top-up" },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    await database.rpc("settle_topup_order", {
      p_order_id: orderId,
      p_status: "failure",
    });
    console.error(
      "Midtrans Snap gagal:",
      response.status,
      await response.text(),
    );
    throw new ApiError(
      502,
      "Midtrans menolak permintaan. Periksa Server Key sandbox.",
    );
  }
  const snap = (await response.json()) as {
    token: string;
    redirect_url: string;
  };
  return {
    order_id: orderId,
    token: snap.token,
    redirect_url: snap.redirect_url,
  };
}

interface MidtransStatus {
  status_code?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
}
// Midtrans rule: success is settlement, or capture (cards) whose fraud_status, if present, is accept.
export function mapStatus(s: MidtransStatus) {
  const status = s.transaction_status ?? "";
  if (
    status === "settlement" ||
    (status === "capture" && (!s.fraud_status || s.fraud_status === "accept"))
  )
    return "settlement";
  return ["deny", "cancel", "expire", "failure"].includes(status)
    ? status
    : "pending";
}

// The Get Status API is the source of truth for both the webhook and the manual check.
async function sync(orderId: string) {
  const response = await fetch(
    hosts.api + "/v2/" + encodeURIComponent(orderId) + "/status",
    { headers: headers(), signal: AbortSignal.timeout(15000) },
  );
  const status = (await response.json()) as MidtransStatus;
  // 404: the customer closed Snap before choosing a payment method; the order stays pending.
  const result = await database.rpc("settle_topup_order", {
    p_order_id: orderId,
    p_status: status.status_code === "404" ? "pending" : mapStatus(status),
    p_payment_type: status.payment_type ?? null,
  });
  check(result.error);
  return result.data as { status: string; amount: number };
}

export async function checkTopUp(actor: Profile, orderId: string) {
  const { data, error } = await database
    .from("topup_orders")
    .select("status,amount")
    .eq("order_id", orderId)
    .eq("user_id", actor.id)
    .maybeSingle();
  check(error);
  if (!data) throw new ApiError(404, "Order top up tidak ditemukan.");
  const order = data.status === "pending" ? await sync(orderId) : data;
  return { order_id: orderId, status: order.status, amount: order.amount };
}

export function validSignature(n: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  const expected = createHash("sha512")
    .update(
      n.order_id + n.status_code + n.gross_amount + env.MIDTRANS_SERVER_KEY,
    )
    .digest("hex");
  return (
    expected.length === n.signature_key.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(n.signature_key))
  );
}

export async function notification(n: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  if (!midtransEnabled() || !validSignature(n))
    throw new ApiError(403, "Signature Midtrans tidak valid.");
  const { data, error } = await database
    .from("topup_orders")
    .select("order_id")
    .eq("order_id", n.order_id)
    .maybeSingle();
  check(error);
  // Unknown ids (e.g. the dashboard's "Test notification") are acknowledged and ignored.
  if (data) await sync(n.order_id);
}
