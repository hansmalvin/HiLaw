# Simple ERD & Frontend Mock Schema — HiLaw

Sesuai kebutuhan tahap awal (**Frontend-First menggunakan Next.js** tanpa backend aktif), skema database dirancang **simpel, ringkas (6 tabel utama), dan langsung dipetakan menjadi TypeScript Interfaces & Mock State**. Desain ini sudah mencakup 3 level user (`CLIENT`, `LAWYER`, `ADMIN`), sistem **LawToken**, pembayaran **Midtrans**, dan fitur konsultasi (**Chat, Telepon, Video Call**).

---

## 1. Entity Relationship Diagram (ERD Simpel)

```mermaid
erDiagram
    USERS ||--o| LAWYER_PROFILES : "memiliki profil advokat (jika role=LAWYER)"
    USERS ||--o{ TOKEN_TRANSACTIONS : "melakukan top-up / pemakaian token"
    TOKEN_PACKAGES ||--o{ TOKEN_TRANSACTIONS : "dibeli melalui Midtrans"
    USERS ||--o{ CONSULTATIONS : "memesan sesi (sebagai CLIENT)"
    LAWYER_PROFILES ||--o{ CONSULTATIONS : "melayani sesi (sebagai LAWYER)"
    CONSULTATIONS ||--o{ CONSULTATION_MESSAGES : "berisi riwayat pesan & lampiran"

    USERS {
        string id PK
        string full_name
        string email
        string role "CLIENT | LAWYER | ADMIN"
        string avatar_url
        int token_balance "Saldo LawToken aktif"
        string created_at
    }

    LAWYER_PROFILES {
        string id PK
        string user_id FK
        string specialization "Pidana | Perdata | Keluarga | Bisnis | Ketenagakerjaan | Properti"
        string license_number "No. KTA PERADI / KAI"
        int experience_years
        float satisfaction_rate "Contoh: 98.5 (%)"
        int token_rate_chat "Tarif token per 30 mnt Chat"
        int token_rate_call "Tarif token per 30 mnt Voice/Video"
        boolean is_online "Status aktif seperti Halodoc"
        string verification_status "PENDING | VERIFIED | REJECTED"
    }

    TOKEN_PACKAGES {
        string id PK
        string package_name "Starter | Reguler | Prioritas | Korporat"
        int token_amount "Jumlah token utama"
        int bonus_tokens "Bonus token promo"
        int price_idr "Harga dalam Rupiah (Midtrans)"
        boolean is_popular
    }

    TOKEN_TRANSACTIONS {
        string id PK
        string user_id FK
        string package_id FK "Nullable jika transaksi pemotongan sesi"
        string tx_type "TOPUP_MIDTRANS | CONSULTATION_DEBIT | REFUND | WITHDRAWAL"
        int token_delta "Positif (+) saat topup, Negatif (-) saat konsultasi"
        int amount_idr "Nominal pembayaran Rp di Midtrans"
        string midtrans_order_id "Contoh: HILAW-ORDER-20261020-001"
        string payment_method "QRIS | GOPAY | BCA_VA | MANDIRI_VA | CREDIT_CARD"
        string payment_status "PENDING | SETTLEMENT | EXPIRE | CANCEL"
        string created_at
    }

    CONSULTATIONS {
        string id PK
        string client_id FK
        string lawyer_id FK
        string channel "CHAT | VOICE_CALL | VIDEO_CALL"
        string case_category "Kategori masalah hukum klien"
        string brief_description "Keluhan / kronologi singkat awal"
        int tokens_locked "Jumlah token yang dipotong untuk sesi ini"
        int duration_minutes "30 atau 60 menit"
        string status "WAITING | ACTIVE | COMPLETED | REFUNDED"
        string legal_summary "Ringkasan saran hukum (Legal Resume) dari pengacara"
        int client_rating "Rating 1-5 bintang setelah selesai"
        string started_at
    }

    CONSULTATION_MESSAGES {
        string id PK
        string consultation_id FK
        string sender_id FK
        string content "Isi teks pesan chat"
        string attachment_url "Link PDF kontrak / foto bukti (opsional)"
        string sent_at
    }
```

---

## 2. Alur Transaksi LawToken & Midtrans (State Flow di Next.js)

```mermaid
sequenceDiagram
    actor Client as User Biasa (Klien)
    participant UI as Next.js Frontend
    participant Midtrans as Midtrans Snap (Mock Modal)
    actor Lawyer as User Pengacara

    Note over Client,Midtrans: Alur 1: Top-Up LawToken
    Client->>UI: Pilih Paket Token (misal: 100 LawToken = Rp 95.000)
    UI->>Midtrans: Buka Midtrans Snap Modal (Order ID: HILAW-xxx)
    Client->>Midtrans: Pilih QRIS / BCA VA & Klik "Bayar"
    Midtrans-->>UI: Callback Status: SETTLEMENT
    UI->>UI: Tambah token_balance User (+100 LawToken)

    Note over Client,Lawyer: Alur 2: Konsultasi dengan Pengacara
    Client->>UI: Pilih Pengacara Spesialis & Klik "Mulai Chat (50 Token)"
    UI->>UI: Cek token_balance >= 50 Token
    UI->>UI: Potong 50 Token & Buat sesi CONSULTATIONS (status: ACTIVE)
    Client->>Lawyer: Diskusi via Chat / Voice / Video Call
    Lawyer->>UI: Kirim "Legal Resume" (Catatan Hukum) & Akhiri Sesi
    UI->>Lawyer: Tambahkan penghasilan token ke dompet Pengacara
```

---

## 3. Kontrak Data TypeScript untuk Next.js (`src/types/hilaw.ts`)

Salin struktur berikut saat mulai membuat komponen di Next.js agar seluruh halaman memiliki tipe data yang konsisten:

```typescript
export type UserRole = 'CLIENT' | 'LAWYER' | 'ADMIN';

export type LegalSpecialization =
  | 'Hukum Keluarga & Waris'
  | 'Hukum Bisnis & Kontrak'
  | 'Hukum Pidana'
  | 'Hukum Perdata & Hutang Piutang'
  | 'Hukum Ketenagakerjaan (PHI)'
  | 'Pertanahan & Properti'
  | 'HKI & Pajak';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  tokenBalance: number;
}

export interface LawyerProfile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string;
  specialization: LegalSpecialization;
  subSpecialties: string[];
  licenseNumber: string; // Contoh: "PERADI-2018-09421"
  university: string;
  experienceYears: number;
  satisfactionRate: number; // Contoh: 99
  totalConsultations: number;
  tokenRateChat: number; // Contoh: 50 (setara Rp 50.000)
  tokenRateCall: number; // Contoh: 90 (setara Rp 90.000)
  isOnline: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface TokenPackage {
  id: string;
  packageName: string;
  tokenAmount: number;
  bonusTokens: number;
  priceIdr: number;
  isPopular?: boolean;
  description: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  userName: string;
  txType: 'TOPUP_MIDTRANS' | 'CONSULTATION_DEBIT' | 'REFUND' | 'WITHDRAWAL';
  tokenDelta: number;
  amountIdr: number;
  midtransOrderId?: string;
  paymentMethod?: 'QRIS' | 'GOPAY' | 'BCA_VA' | 'MANDIRI_VA' | 'CREDIT_CARD';
  paymentStatus: 'PENDING' | 'SETTLEMENT' | 'EXPIRE';
  createdAt: string;
}

export interface ConsultationSession {
  id: string;
  clientId: string;
  clientName: string;
  lawyerId: string;
  lawyerName: string;
  lawyerSpecialty: LegalSpecialization;
  channel: 'CHAT' | 'VOICE_CALL' | 'VIDEO_CALL';
  briefDescription: string;
  tokensLocked: number;
  durationMinutes: number;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  legalSummary?: {
    issueAnalysis: string;
    legalBasis: string;
    recommendedAction: string[];
  };
  startedAt: string;
}
```
