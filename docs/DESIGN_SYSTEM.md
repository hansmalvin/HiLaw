# HiLaw Design System & UI/UX Blueprint
**Tema Visual: "Pastel Legal Trust & Halodoc Familiarity"**

Dokumen ini menjadi panduan konteks visual saat membangun antarmuka **HiLaw** menggunakan **Next.js + Tailwind CSS**. Desain menggabungkan struktur navigasi **Halodoc** yang bersih, cepat, dan ramah pengguna dengan palet warna **Pastel Modern** yang memberikan rasa tenang, aman, dan berwibawa.

---

## 1. Filosofi Warna (Pastel Legal Trust Palette)

Masalah hukum sering membuat pengguna cemas. Berbeda dengan website firma hukum tradisional yang terkesan kaku dan gelap (hitam/emas tua), **HiLaw** menggunakan perpaduan **Pastel Slate Indigo (Kepercayaan & Hukum)**, **Soft Coral Rose (Aksen Aksi Cepat ala Halodoc)**, dan **Pastel Sage Mint (Validasi & Keamanan)** di atas latar belakang yang bersih dan hangat.

### A. Warna Utama & Aksen (Primary & Secondary)
| Peran Warna | Nama Warna | Hex Code | Penggunaan pada UI |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | **Royal Slate Blue** | `#3B5BDB` | Header aktif, tombol utama navigasi, badge hukum utama, link aktif |
| **Primary Pastel Surface** | **Soft Periwinkle Pastel** | `#EDF2FF` | Background hero section, highlight kartu kategori, chip filter aktif |
| **Action / CTA (Halodoc Vibe)** | **Pastel Rose Coral** | `#E64980` / `#F06595` | Tombol CTA mendesak ("Chat Sekarang", "Konsultasi Instan") |
| **Action Pastel Surface** | **Blush Pink Pastel** | `#FFF0F6` | Background ikon cepat darurat / konsultasi langsung |
| **Trust & Verified** | **Sage Emerald** | `#0CA678` | Status "Online", badge "Terverifikasi PERADI", status pembayaran sukses |
| **Trust Pastel Surface** | **Mint Cream Pastel** | `#E6FCF5` | Background badge verifikasi advokat & banner jaminan privasi |
| **Token & Midtrans Accent** | **Warm Honey Gold** | `#F59F00` | Ikon **LawToken (🪙)**, badge paket populer, rating bintang pengacara |
| **Token Pastel Surface** | **Buttercream Pastel** | `#FFF9DB` | Kartu saldo dompet LawToken & highlight promo top-up |

### B. Warna Netral & Latar (Surfaces & Typography)
| Peran Warna | Nama Warna | Hex Code | Penggunaan pada UI |
| :--- | :--- | :--- | :--- |
| **Page Background** | **Warm Cloud Alabaster** | `#F8FAFC` | Background utama halaman (tidak menyilaukan mata) |
| **Card Surface** | **Pure White** | `#FFFFFF` | Kartu pengacara, modal Midtrans, chat container |
| **Secondary Surface** | **Soft Cool Gray** | `#F1F5F9` | Input form, bubble chat lawan bicara, skeleton loading |
| **Border / Divider** | **Pastel Slate Border** | `#E2E8F0` | Garis tepi kartu (`1px solid`), pembatas antar seksi |
| **Text Primary** | **Deep Navy Charcoal** | `#1E293B` | Judul, nama pengacara, nominal harga |
| **Text Secondary** | **Muted Slate** | `#64748B` | Subjudul, deskripsi spesialisasi, timestamp chat |

---

## 2. Tipografi (Typography)

- **Heading & Display:** `Plus Jakarta Sans` (SemiBold `600` & Bold `700`) — memberikan kesan modern, ramah, dan sangat cocok untuk produk digital Indonesia (gaya Halodoc/Gojek).
- **Body & UI Controls:** `Inter` atau `Plus Jakarta Sans` (Regular `400` & Medium `500`) — keterbacaan tinggi untuk deskripsi hukum dan ruang chat.
- **Monospace (Khusus Angka Token & Order ID Midtrans):** `JetBrains Mono` — untuk kode referensi transaksi dan penghitung waktu (timer) sesi konsultasi.

---

## 3. Struktur Halaman & Sitemap Next.js (App Router)

Berikut adalah struktur rute (`src/app/`) yang direkomendasikan untuk tahap pengembangan tampilan:

```text
src/
├── app/
│   ├── layout.tsx                  # Root layout + Navbar + Role Switcher (Demo Bar)
│   ├── page.tsx                    # Landing Page (Acuan Halodoc: Hero, Layanan Utama, Spesialis, Pengacara Online)
│   ├── lawyers/
│   │   ├── page.tsx                # Direktori & Pencarian Spesialis Pengacara + Filter Kategori/Harga
│   │   └── [id]/
│   │       └── page.tsx            # Detail Profil Pengacara, Lisensi PERADI, Ulasan, & Pilih Sesi
│   ├── consultation/
│   │   └── [sessionId]/
│   │       └── page.tsx            # Ruang Konsultasi (Live Chat, Voice/Video Call UI, Timer, Legal Resume)
│   ├── wallet/
│   │   └── page.tsx                # Dompet LawToken, Katalog Paket Top-Up, & Simulasi Midtrans Snap Modal
│   ├── lawyer-dashboard/           # [ROLE: PENGACARA]
│   │   ├── page.tsx                # Dashboard Mitra Advokat (Toggle Online, Antrean Klien, Statistik)
│   │   └── workspace/
│   │       └── page.tsx            # Workspace Chat Pengacara + Form Pembuatan Legal Resume
│   └── admin/                      # [ROLE: ADMIN]
│       ├── page.tsx                # Dashboard KPI BMLC, Verifikasi Lisensi Pengacara, & Log Midtrans
├── components/
│   ├── navbar/                     # Header dengan indikator Saldo LawToken & Switcher Role
│   ├── halodoc-cards/              # ServiceCard, CategoryPill, LawyerCard (gaya Halodoc)
│   ├── midtrans/                   # MidtransSnapModal.tsx (Simulasi QRIS, VA, GoPay)
│   └── consultation/               # ChatWindow.tsx, VideoCallOverlay.tsx, LegalResumeCard.tsx
├── data/
│   └── mockData.ts                 # Data statis pengacara, paket token, sesi chat, dan transaksi
└── types/
    └── hilaw.ts                    # Definisi tipe data sesuai ERD
```

---

## 4. Anatomi Komponen Utama (Acuan Halodoc)

### 1. Kartu Pengacara (`LawyerCard.tsx`)
Mirip dengan kartu daftar dokter di Halodoc:
- **Bagian Kiri:** Foto avatar bulat/rounded (`72x72px`) dengan titik indikator hijau (`Online`) di sudut kanan bawah.
- **Bagian Tengah:**
  - Nama & Gelar: *"Adv. Raka Mahendra, S.H., M.H."*
  - Spesialisasi: Pill pastel biru *"Spesialis Hukum Bisnis & Kontrak"*
  - Badge Meta: `💼 9 Tahun` • `👍 99% (142 Sesi)` • `🛡️ PERADI Terverifikasi`
- **Bagian Kanan / Bawah:**
  - Tarif Transparan: `🪙 50 LawToken` *(setara Rp 50.000 / 30 mnt)*
  - Tombol Aksi: Tombol warna **Pastel Rose Coral (`#E64980`)** bertuliskan **"Chat"** atau tombol outline **"Jadwalkan Video"**.

### 2. Modal Simulasi Pembayaran Midtrans (`MidtransSnapModal.tsx`)
Ketika pengguna memilih paket Top-Up (misal: **Paket Reguler - 100 LawToken seharga Rp 95.000**):
- Muncul *floating modal* menyerupai **Midtrans Snap** asli:
  - Header logo HiLaw + Total Pembayaran + *Countdown* batas waktu bayar.
  - Accordion pilihan metode: **QRIS (Scan Barcode)**, **GoPay / ShopeePay**, **BCA / Mandiri / BRI Virtual Account**, **Kartu Kredit**.
  - Tombol **"Simulasikan Pembayaran Berhasil (Settlement)"** untuk langsung menambahkan LawToken ke saldo user pada prototipe Next.js.
