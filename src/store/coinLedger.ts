import type {
  ApiConsultation,
  ApiTransaction,
  ConsultationStatus,
} from "@/lib/api";

// Balances and the ledger live in Supabase (migration 004); this file only shapes them for the UI.
export type { ConsultationStatus };

export interface CoinTransaction {
  id: string;
  type: ApiTransaction["type"];
  coins: number;
  balanceAfter: number;
  createdAt: string;
  description: string;
  method?: string;
  consultationId?: string;
  userName?: string;
}

export interface CustomerConsultation {
  id: string;
  customerId: string;
  customerName: string;
  lawyerId: string;
  lawyerUserId: string | null;
  lawyerName: string;
  specialty: string;
  rate: number;
  duration: number;
  status: ConsultationStatus;
  brief: string;
  createdAt: string;
  startedAt: string | null;
}

export const toTransaction = (
  t: ApiTransaction & { user_name?: string },
): CoinTransaction => ({
  id: t.id,
  type: t.type,
  coins: t.amount,
  balanceAfter: t.balance_after,
  createdAt: t.created_at,
  description: t.description,
  method: t.method ?? undefined,
  consultationId: t.consultation_id ?? undefined,
  userName: t.user_name,
});

export const toConsultation = (c: ApiConsultation): CustomerConsultation => ({
  id: c.id,
  customerId: c.customer_id,
  customerName: c.customer_name,
  lawyerId: c.lawyer_id,
  lawyerUserId: c.lawyer_user_id,
  lawyerName: c.lawyer_name,
  specialty: c.specialization,
  rate: c.rate,
  duration: c.duration_minutes,
  status: c.status,
  brief: c.brief,
  createdAt: c.created_at,
  startedAt: c.started_at,
});

export const COIN_PACKAGES = [50, 100, 250, 500] as const;

// Chat session packages; a lawyer's rate is the price of the 30-minute package.
export const SESSION_PACKAGES = [
  { minutes: 15, name: "Kilat", note: "Pertanyaan singkat" },
  { minutes: 30, name: "Standar", note: "Konsultasi lengkap" },
  { minutes: 60, name: "Mendalam", note: "Kasus kompleks · hemat hingga 10%" },
] as const;

// Same rule as package_price() in migration 005. Integer math on purpose: 5 * 0.6 is 3.0000000000000004.
export const packagePrice = (rate: number, minutes: number) =>
  minutes === 15
    ? Math.ceil((rate * 6) / 10)
    : minutes === 60
      ? Math.ceil((rate * 18) / 10)
      : rate;

export const PAYMENT_METHODS = [
  "QRIS",
  "BCA Virtual Account",
  "Mandiri Virtual Account",
  "GoPay",
  "ShopeePay",
  "Kartu Kredit",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const transactionLabel: Record<CoinTransaction["type"], string> = {
  TOP_UP: "Top Up Poin",
  CONSULTATION_PAYMENT: "Pembayaran Konsultasi",
  REFUND: "Refund Poin",
  EARNING: "Pendapatan Konsultasi",
};

export const rupiah = (points: number) =>
  "Rp" + (points * 1000).toLocaleString("id-ID");

// Same rule as transition_consultation(): HiLaw keeps floor(20%) of each completed session.
export function earnings(
  consultations: CustomerConsultation[],
  lawyerId?: string,
) {
  const completed = consultations.filter(
    (c) => c.status === "Completed" && (!lawyerId || c.lawyerId === lawyerId),
  );
  const gross = completed.reduce((sum, c) => sum + c.rate, 0);
  const platform = completed.reduce((sum, c) => sum + Math.floor(c.rate / 5), 0);

  return { completed, gross, platform, lawyer: gross - platform };
}
