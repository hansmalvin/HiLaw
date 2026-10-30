import type { PlatformData } from './platform';
import type { PublicLawyer } from '@/data/publicData';

export type ConsultationStatus = 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface CoinTransaction {
  id: string;
  userId: string;
  requestId: string;
  type: 'TOP_UP' | 'CONSULTATION_PAYMENT' | 'REFUND';
  coins: number;
  balanceAfter: number;
  status: 'Success';
  createdAt: string;
  description: string;
  method?: string;
  consultationId?: string;
}

export interface CustomerConsultation {
  id: string;
  customerId: string;
  customerName: string;
  lawyerId: string;
  lawyerName: string;
  specialty: string;
  rate: number;
  duration: number;
  status: ConsultationStatus;
  brief: string;
  createdAt: string;
}

export interface CoinStore {
  version: 1;
  platform?: PlatformData;
  balances: Record<string, number>;
  transactions: CoinTransaction[];
  consultations: CustomerConsultation[];
}

export const COIN_PACKAGES = [50, 100, 250, 500] as const;

export const PAYMENT_METHODS = [
  'QRIS',
  'BCA Virtual Account',
  'Mandiri Virtual Account',
  'GoPay',
  'ShopeePay',
  'Kartu Kredit'
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const transactionLabel = {
  TOP_UP: 'Top Up Coins',
  CONSULTATION_PAYMENT: 'Pembayaran Konsultasi',
  REFUND: 'Refund Coins'
};

export const rupiah = (coins: number) => 'Rp' + (coins * 1000).toLocaleString('id-ID');

export function initialCoinStore(): CoinStore {
  return {
    version: 1,
    balances: {
      'demo-customer': 120
    },
    transactions: [
      {
        id: 'seed-payment',
        requestId: 'seed-payment',
        userId: 'demo-customer',
        type: 'CONSULTATION_PAYMENT',
        coins: -50,
        balanceAfter: 120,
        status: 'Success',
        createdAt: '2026-10-28T03:00:00.000Z',
        description: 'Konsultasi bersama Nadira Putri',
        consultationId: 'seed-consultation'
      },
      {
        id: 'seed-topup',
        requestId: 'seed-topup',
        userId: 'demo-customer',
        type: 'TOP_UP',
        coins: 170,
        balanceAfter: 170,
        status: 'Success',
        createdAt: '2026-10-27T03:00:00.000Z',
        description: 'Saldo awal demonstrasi',
        method: 'Saldo demo'
      },
    ],
    consultations: [
      {
        id: 'seed-consultation',
        customerId: 'demo-customer',
        customerName: 'Aulia Rahma',
        lawyerId: 'nadira',
        lawyerName: 'Nadira Putri, S.H., M.H.',
        specialty: 'Hukum Keluarga',
        rate: 50,
        duration: 30,
        status: 'Completed',
        brief: 'Memahami dokumen awal untuk konsultasi keluarga. Data contoh demonstrasi.',
        createdAt: '2026-10-28T03:00:00.000Z'
      }
    ],
  };
}

export function isCoinStore(value: unknown): value is CoinStore {
  if (!value || typeof value !== 'object')
    return false;
  const s = value as CoinStore;

  return s.version === 1 && !!s.balances && typeof s.balances === 'object'
    && !Array.isArray(s.balances)
    && Object.values(s.balances).every(n => Number.isSafeInteger(n) && n >= 0)
    && Array.isArray(s.transactions)
    && s.transactions.every(
      t => t && typeof t.id === 'string' && typeof t.requestId === 'string'
        && typeof t.userId === 'string'
        && ['TOP_UP', 'CONSULTATION_PAYMENT', 'REFUND'].includes(t.type)
        && Number.isSafeInteger(t.coins)
        && Number.isSafeInteger(t.balanceAfter)
        && t.balanceAfter >= 0
        && t.status === 'Success'
        && typeof t.description === 'string'
        && Number.isFinite(Date.parse(t.createdAt))
    )
    && Array.isArray(s.consultations)
    && s.consultations.every(
      c => c && typeof c.id === 'string' && typeof c.customerId === 'string'
        && typeof c.customerName === 'string'
        && typeof c.lawyerId === 'string'
        && typeof c.lawyerName === 'string'
        && typeof c.specialty === 'string'
        && Number.isSafeInteger(c.rate)
        && c.rate > 0
        && Number.isSafeInteger(c.duration)
        && c.duration > 0
        && typeof c.brief === 'string'
        && ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'].includes(c.status)
        && Number.isFinite(Date.parse(c.createdAt))
    );
}

function validateRequest(userId: string, requestId: string) {
  if (!userId || !requestId)
    throw new Error('Identitas transaksi tidak valid.');
}

export function applyTopUp(
  store: CoinStore,
  input: {
    userId: string;
    coins: number;
    method: PaymentMethod;
    requestId: string;
    id: string;
    now: string
  }
): CoinStore {
  validateRequest(input.userId, input.requestId);
  if (store.transactions.some(t => t.requestId === input.requestId))
    return store;
  if (!(COIN_PACKAGES as readonly number[]).includes(input.coins)
    || !(PAYMENT_METHODS as readonly string[]).includes(input.method))
    throw new Error('Paket atau metode pembayaran tidak valid.');
  const balance = (store.balances[input.userId] ?? 0) + input.coins;
  if (!Number.isSafeInteger(balance))
    throw new Error('Saldo melebihi batas simulasi.');

  return {
    ...store,
    balances: {
      ...store.balances,
      [input.userId]: balance
    },
    transactions: [
      {
        id: input.id,
        requestId: input.requestId,
        userId: input.userId,
        type: 'TOP_UP',
        coins: input.coins,
        balanceAfter: balance,
        status: 'Success',
        createdAt: input.now,
        description: 'Top Up ' + input.coins + ' HiLaw Coins',
        method: input.method
      },
      ...store.transactions
    ]
  };
}

export function applyConsultation(
  store: CoinStore,
  input: {
    userId: string;
    name: string;
    lawyer: PublicLawyer;
    brief: string;
    requestId: string;
    id: string;
    now: string
  }
): CoinStore {
  validateRequest(input.userId, input.requestId);
  if (store.transactions.some(t => t.requestId === input.requestId))
    return store;
  if (!input.lawyer.online)
    throw new Error('Pengacara belum tersedia. Silakan pilih pengacara lain.');
  if (input.brief.trim().length < 10 || input.brief.length > 1500)
    throw new Error('Ceritakan masalah Anda dalam 10–1.500 karakter.');
  if (!Number.isSafeInteger(input.lawyer.rate) || input.lawyer.rate <= 0)
    throw new Error('Tarif konsultasi tidak valid.');
  const balance = store.balances[input.userId] ?? 0;
  if (balance < input.lawyer.rate)
    throw new Error('Saldo Coins tidak mencukupi. Silakan top up terlebih dahulu.');
  // Repeated clicks and a second checkout cannot create another live request for the same lawyer.
  if (store.consultations.some(
    c => c.customerId === input.userId && c.lawyerId === input.lawyer.id
      && !['Completed', 'Cancelled'].includes(c.status)
  ))
    throw new Error('Anda sudah memiliki konsultasi aktif atau menunggu dengan pengacara ini.');
  const remaining = balance - input.lawyer.rate;
  const consultation: CustomerConsultation = {
    id: input.id,
    customerId: input.userId,
    customerName: input.name,
    lawyerId: input.lawyer.id,
    lawyerName: input.lawyer.name,
    specialty: input.lawyer.specialty,
    rate: input.lawyer.rate,
    duration: 30,
    status: 'Pending',
    brief: input.brief.trim(),
    createdAt: input.now
  };

  return {
    ...store,
    balances: {
      ...store.balances,
      [input.userId]: remaining
    },
    consultations: [consultation, ...store.consultations],
    transactions: [
      {
        id: 'tx-' + input.id,
        requestId: input.requestId,
        userId: input.userId,
        type: 'CONSULTATION_PAYMENT',
        coins: -input.lawyer.rate,
        balanceAfter: remaining,
        status: 'Success',
        createdAt: input.now,
        description: 'Konsultasi bersama ' + input.lawyer.name,
        consultationId: input.id
      },
      ...store.transactions
    ]
  };
}
