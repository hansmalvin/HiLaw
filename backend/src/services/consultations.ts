import { database } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import type { Profile } from "../types/index.js";

const columns =
  "id,customer_id,lawyer_id,rate,duration_minutes,status,brief,started_at,ended_at,created_at," +
  "customer:profiles!consultations_customer_id_fkey(full_name)," +
  "lawyer:lawyer_profiles!consultations_lawyer_id_fkey(user_id,specialization,profile:profiles!lawyer_profiles_user_id_fkey(full_name))";

interface Row {
  id: string;
  customer_id: string;
  lawyer_id: string;
  rate: number;
  duration_minutes: number;
  status: string;
  brief: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  customer: { full_name: string } | null;
  lawyer: {
    user_id: string;
    specialization: string | null;
    profile: { full_name: string } | null;
  } | null;
}

function flatten({ customer, lawyer, ...c }: Row) {
  return {
    ...c,
    customer_name: customer?.full_name ?? "Customer",
    lawyer_user_id: lawyer?.user_id ?? null,
    lawyer_name: lawyer?.profile?.full_name ?? "Pengacara",
    specialization: lawyer?.specialization ?? "Konsultasi Umum",
  };
}
type Consultation = ReturnType<typeof flatten>;

export async function wallet(actor: Profile) {
  const [balance, history] = await Promise.all([
    database
      .from("wallets")
      .select("balance")
      .eq("user_id", actor.id)
      .maybeSingle(),
    database
      .from("point_transactions")
      .select(
        "id,type,amount,balance_after,description,method,consultation_id,created_at",
      )
      .eq("user_id", actor.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  check(balance.error);
  check(history.error);
  return { balance: balance.data?.balance ?? 0, transactions: history.data };
}

export async function topUp(
  actor: Profile,
  input: { amount: number; method: string; request_id: string },
) {
  const result = await database.rpc("topup_points", {
    p_user_id: actor.id,
    p_amount: input.amount,
    p_method: input.method,
    p_request_id: input.request_id,
  });
  check(result.error);
  return wallet(actor);
}

export async function book(
  actor: Profile,
  input: {
    lawyer_id: string;
    brief: string;
    request_id: string;
    duration_minutes: number;
  },
) {
  const result = await database.rpc("book_consultation", {
    p_customer_id: actor.id,
    p_lawyer_id: input.lawyer_id,
    p_brief: input.brief,
    p_request_id: input.request_id,
    p_duration: input.duration_minutes,
  });
  check(result.error);
  return { id: (result.data as { id: string }).id };
}

// Sessions end by time even when nobody is in the room: whoever reads a due session ends it.
const timeUp = (c: {
  status: string;
  started_at: string | null;
  duration_minutes: number;
}) =>
  c.status === "Ongoing" &&
  !!c.started_at &&
  Date.parse(c.started_at) + c.duration_minutes * 60000 <= Date.now();

async function expire(id: string | null) {
  // The database re-checks the time with its own clock before completing anything.
  const { error } = await database.rpc("expire_due_consultations", {
    p_consultation_id: id,
  });
  check(error);
}

export async function listConsultations(actor: Profile) {
  let lawyerId: string | null = null;
  if (actor.role === "lawyer") {
    const own = await database
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", actor.id)
      .single();
    check(own.error);
    lawyerId = own.data!.id;
  }
  const load = async () => {
    let query = database
      .from("consultations")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(200);
    if (actor.role === "customer") query = query.eq("customer_id", actor.id);
    if (lawyerId) query = query.eq("lawyer_id", lawyerId);
    const { data, error } = await query;
    check(error);
    return (data as unknown as Row[]).map(flatten);
  };
  const rows = await load();
  if (!rows.some(timeUp)) return rows;
  await expire(null);
  return load();
}

const isCustomer = (actor: Profile, c: Consultation) =>
  c.customer_id === actor.id;
const isLawyer = (actor: Profile, c: Consultation) =>
  c.lawyer_user_id === actor.id;

// Not found and not yours look the same, so ids of other users' consultations do not leak.
async function fetchOne(id: string) {
  const { data, error } = await database
    .from("consultations")
    .select(columns)
    .eq("id", id)
    .maybeSingle();
  check(error);
  return data ? flatten(data as unknown as Row) : null;
}

async function readable(actor: Profile, id: string) {
  const c = await fetchOne(id);
  if (
    !c ||
    !(actor.role === "admin" || isCustomer(actor, c) || isLawyer(actor, c))
  )
    throw new ApiError(404, "Konsultasi tidak ditemukan pada akun Anda.");
  if (!timeUp(c)) return c;
  await expire(id);
  return (await fetchOne(id)) ?? c;
}

export async function consultation(actor: Profile, id: string) {
  const c = await readable(actor, id);
  const review = await database
    .from("reviews")
    .select("rating,body,created_at")
    .eq("consultation_id", id)
    .maybeSingle();
  check(review.error);
  return { ...c, review: review.data };
}

export async function transition(actor: Profile, id: string, status: string) {
  // Ending a session the timer already ended is a no-op, not an error.
  if ((await readable(actor, id)).status === status)
    return consultation(actor, id);
  const result = await database.rpc("transition_consultation", {
    p_actor_id: actor.id,
    p_consultation_id: id,
    p_status: status,
  });
  check(result.error);
  return consultation(actor, id);
}

export async function messages(actor: Profile, id: string) {
  const c = await readable(actor, id);
  // shortcut: whole thread (max 500) per poll; a 30-minute chat stays small. Page by time if threads grow.
  const { data, error } = await database
    .from("consultation_messages")
    .select("id,sender_id,body,created_at")
    .eq("consultation_id", id)
    .order("created_at")
    .limit(500);
  check(error);
  return {
    status: c.status,
    started_at: c.started_at,
    items: (data ?? []).map((m) => ({
      ...m,
      sender_name:
        m.sender_id === c.customer_id
          ? c.customer_name
          : m.sender_id === c.lawyer_user_id
            ? c.lawyer_name
            : "Pengguna dihapus",
    })),
  };
}

export async function sendMessage(
  actor: Profile,
  id: string,
  input: { id: string; body: string },
) {
  const c = await readable(actor, id);
  if (!isCustomer(actor, c) && !isLawyer(actor, c))
    throw new ApiError(
      403,
      "Hanya peserta konsultasi yang dapat mengirim pesan.",
    );
  if (c.status !== "Ongoing")
    throw new ApiError(409, "Pesan hanya dapat dikirim saat sesi berlangsung.");
  // A retried send reuses its client id, so it is ignored instead of duplicated.
  const { error } = await database.from("consultation_messages").upsert(
    {
      id: input.id,
      consultation_id: id,
      sender_id: actor.id,
      body: input.body,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  check(error);
  return messages(actor, id);
}

export async function review(
  actor: Profile,
  id: string,
  input: { rating: number; body?: string },
) {
  const c = await readable(actor, id);
  if (!isCustomer(actor, c) || c.status !== "Completed")
    throw new ApiError(
      403,
      "Ulasan hanya untuk konsultasi selesai milik Anda.",
    );
  const { error } = await database.from("reviews").insert({
    consultation_id: id,
    lawyer_id: c.lawyer_id,
    customer_id: actor.id,
    rating: input.rating,
    body: input.body || null,
  });
  if (error?.code === "23505")
    throw new ApiError(409, "Konsultasi ini sudah diulas.");
  check(error);
  return consultation(actor, id);
}

export async function lawyerReviews(lawyerId: string) {
  const { data, error } = await database
    .from("reviews")
    .select(
      "id,rating,body,created_at,customer:profiles!reviews_customer_id_fkey(full_name)",
    )
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false })
    .limit(20);
  check(error);
  // Public page: show reviewers by first name only.
  return (
    data as unknown as {
      id: string;
      rating: number;
      body: string | null;
      created_at: string;
      customer: { full_name: string } | null;
    }[]
  ).map(({ customer, ...r }) => ({
    ...r,
    name: customer?.full_name.split(" ")[0] ?? "Customer",
  }));
}

export async function adminTransactions() {
  const [items, wallets] = await Promise.all([
    database
      .from("point_transactions")
      .select(
        "id,user_id,type,amount,balance_after,description,method,created_at,user:profiles!point_transactions_user_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    database
      .from("wallets")
      .select("balance,owner:profiles!wallets_user_id_fkey(role)"),
  ]);
  check(items.error);
  check(wallets.error);
  const owners = wallets.data as unknown as {
    balance: number;
    owner: { role: string } | null;
  }[];
  return {
    customer_balance: owners
      .filter((w) => w.owner?.role === "customer")
      .reduce((sum, w) => sum + w.balance, 0),
    items: (
      items.data as unknown as {
        user: { full_name: string } | null;
        [key: string]: unknown;
      }[]
    ).map(({ user, ...t }) => ({ ...t, user_name: user?.full_name ?? "-" })),
  };
}
