# PRD — HiLaw: Sistem Poin, Chat Room Konsultasi & Chatbot Gemini

| Item | Isi |
| --- | --- |
| Produk | HiLaw — konsultasi hukum online (acuan UX: Halodoc) |
| Versi dokumen | 1.2 · 2 November 2026 (Midtrans Snap sandbox, paket sesi, batas waktu, modal ulasan, deploy) |
| Status | Disetujui untuk implementasi |
| Stack | Next.js 16 (App Router) · Express 5 (`backend/`) · Supabase (Auth, Postgres, Storage) · Gemini API |

---

## 1. Latar belakang

Autentikasi, profil, dan verifikasi pengacara sudah tersimpan di Supabase. Namun saldo,
konsultasi, dan chat masih berupa **simulasi `localStorage`**. Akibatnya:

1. **Chat tidak pernah sampai ke lawan bicara.** Customer dan pengacara memakai browser
   berbeda, sehingga pesan dan permintaan konsultasi hanya terlihat di browser pengirim.
2. **Saldo bisa dimanipulasi** dari DevTools karena disimpan di browser.
3. **Tarif dan status online pengacara** disimpan per browser, sehingga customer melihat
   tarif default (50) alih-alih tarif yang diatur pengacara.
4. **Chatbot** memakai pencocokan kata kunci yang mudah salah, mis. "KDRT di rumah tangga"
   diarahkan ke Hukum Properti karena kata "rumah".
5. Istilah mata uang tidak konsisten (LawToken di dokumen, Coins di UI), dan palet warna
   UI (cokelat) tidak sesuai Design System *Pastel Legal Trust*.

## 2. Tujuan

| # | Tujuan | Ukuran keberhasilan |
| --- | --- | --- |
| G1 | Customer membayar konsultasi dengan **Poin HiLaw** yang tersimpan di server | Saldo sama di semua perangkat; tidak bisa diubah dari browser |
| G2 | Customer dan pengacara **chat dua arah** dalam satu ruang konsultasi | Pesan tampil di sisi lawan ≤ 5 detik |
| G3 | Chatbot **mengarahkan kasus ke spesialis yang benar** dan menampilkan pengacara yang cocok | Contoh uji di §6.4 menghasilkan spesialisasi yang benar |
| G4 | Kode dan desain konsisten dengan Design System dan prinsip YAGNI | Lint 0 error, semua tes lulus, palet sesuai |

## 3. Pengguna & peran

| Peran | Kebutuhan pada fitur ini |
| --- | --- |
| `CUSTOMER` | Top up poin, memesan konsultasi, chat dengan pengacara, memberi ulasan, bertanya ke chatbot |
| `LAWYER` | Mengatur tarif & status online, menerima/menolak permintaan, chat dengan klien, melihat pendapatan poin |
| `ADMIN` | Memantau seluruh konsultasi & transaksi poin, membatalkan permintaan bermasalah (dengan refund) |

---

## 4. Fitur 1 — Sistem Poin HiLaw

### 4.1 Aturan bisnis

- **Nama resmi:** *Poin HiLaw* (menggantikan istilah "Coins" dan "LawToken" di UI).
- **Kurs:** 1 Poin = Rp1.000.
- **Paket top up:** 50, 100, 250, 500 Poin. Hanya `CUSTOMER` yang bisa top up. Pembayaran memakai
  **Midtrans Snap Sandbox** bila key diisi (v1.2, migration 006), dan simulasi bila tidak. Poin
  hanya ditambahkan saat Midtrans melaporkan `settlement` (atau `capture` dengan fraud `accept`).
- **Tarif dasar:** ditentukan pengacara, 1–10.000 Poin per 30 menit.
- **Paket sesi chat** (harga dibulatkan ke atas ke Poin utuh, migration 005):

  | Paket | Durasi | Harga | Cocok untuk |
  | --- | --- | --- | --- |
  | Kilat | 15 menit | 60% tarif dasar | Pertanyaan singkat |
  | Standar | 30 menit | 100% tarif dasar | Konsultasi lengkap |
  | Mendalam | 60 menit | 180% tarif dasar (hemat hingga 10%) | Kasus kompleks |

  Contoh tarif dasar 50 Poin: Kilat 30, Standar 50, Mendalam 90 Poin.
- **Pemotongan:** poin dipotong **sekali saat memesan** (status `Pending`).
- **Batas waktu:** sesi berakhir otomatis (`Completed`) saat durasi paket habis, dihitung
  dari `started_at` dengan jam database. Mengakhiri lebih awal tidak mengembalikan sisa waktu.
- **Refund penuh** bila konsultasi dibatalkan saat `Pending`, oleh pengacara (tolak),
  customer (batalkan), atau admin.
- **Bagi hasil** saat konsultasi `Completed`: komisi HiLaw = `floor(tarif × 20%)`,
  pengacara menerima sisanya sebagai transaksi `EARNING` ke saldo poinnya.
- **Saldo tidak boleh negatif.** Semua mutasi saldo terjadi di fungsi Postgres dalam satu
  transaksi dengan row lock, sehingga dua klik bersamaan tidak memotong dua kali.
- **Idempoten:** setiap top up dan pemesanan membawa `request_id` (UUID dari klien).
  Request yang diulang mengembalikan hasil yang sama tanpa mutasi kedua.
- Satu customer hanya boleh memiliki **satu konsultasi aktif** (`Pending`/`Confirmed`/
  `Ongoing`) per pengacara.

### 4.2 Siklus status konsultasi

```
Pending ──(pengacara terima)──▶ Confirmed ──(pengacara mulai)──▶ Ongoing ──(salah satu akhiri)──▶ Completed
   │                                                                              (pengacara +80% poin)
   └──(pengacara tolak / customer batal / admin batal)──▶ Cancelled (refund 100%)
```

### 4.3 Kriteria penerimaan

- [ ] Customer baru memiliki saldo 0 dan bisa top up; saldo baru tampil di Navbar.
- [ ] Memesan dengan saldo kurang ditolak server, bukan hanya oleh UI.
- [ ] Menolak permintaan mengembalikan poin, dan riwayat menampilkan transaksi `REFUND`.
- [ ] Menyelesaikan konsultasi menambah saldo pengacara sebesar tarif − komisi.
- [ ] Tarif yang diubah pengacara langsung terlihat di direktori pada perangkat lain.

---

## 5. Fitur 2 — Chat Room Konsultasi

### 5.1 Perilaku

- Rute: `/consultations/[id]`, hanya untuk customer pemilik, pengacara terkait, dan admin.
- Kolom kirim pesan aktif hanya saat status `Ongoing`, dan hanya untuk dua peserta.
  Admin hanya bisa membaca.
- Pesan berisi 1–2.000 karakter teks. Riwayat tetap tersimpan setelah sesi selesai.
- **Pembaruan pesan:** polling `GET /consultations/:id/messages` setiap 3 detik selama
  ruang terbuka (seluruh thread, maks. 500 pesan; sesi 30 menit tetap kecil dan tidak ada
  pesan yang terlewat). Supabase Realtime dipertimbangkan bila sesi aktif bertambah.
- Status konsultasi ikut diperbarui saat polling, sehingga customer melihat sesi dimulai
  tanpa memuat ulang halaman.
- Hitung mundur `mm:ss` sesuai paket (berubah merah pada 5 menit terakhir). Saat waktu
  habis, server menutup sesi pada polling berikutnya dan kolom chat terkunci.
- **Modal ulasan:** begitu sesi `Completed`, karena waktu habis, diakhiri customer, atau
  diakhiri pengacara, customer melihat modal berisi rating **1–5 bintang (wajib)** dan
  deskripsi (**opsional**, maks. 1.000 karakter). "Nanti saja" menutup modal, dan tombol
  "Beri ulasan" tetap tersedia di panel konsultasi.
- Pesan dikirim dengan UUID dari klien, sehingga kirim ulang saat jaringan putus tidak
  menggandakan pesan.

### 5.2 Kriteria penerimaan

- [ ] Customer (browser A) dan pengacara (browser B) saling melihat pesan ≤ 5 detik.
- [ ] Pengguna lain mendapat 403/404 saat membuka id konsultasi milik orang lain.
- [ ] Pesan ditolak server saat status bukan `Ongoing`.

---

## 6. Fitur 3 — Chatbot HiLaw Assistant (Gemini)

### 6.1 Perilaku

- Customer menceritakan kasusnya. Bot membalas dengan:
  1. ringkasan singkat dan langkah persiapan (dokumen/kronologi),
  2. **satu spesialisasi** dari 8 kategori HiLaw beserta alasannya,
  3. tingkat urgensi (`rendah` / `sedang` / `tinggi`),
  4. **hingga 3 pengacara** terverifikasi di spesialisasi tersebut (yang online lebih dulu,
     lalu rating tertinggi), dengan tombol ke profil. Jika belum ada, tampilkan tautan
     ke direktori kategori tersebut.
- Bila bot ragu, bot mengajukan pertanyaan klarifikasi dan merekomendasikan
  *Konsultasi Umum*.
- Bila ada **bahaya langsung** (kekerasan, ancaman), bot menyarankan menghubungi
  110 (Polisi) atau 112 dan menandai urgensi `tinggi`.
- Bot **bukan pengganti nasihat hukum** dan tidak menjanjikan hasil perkara.

### 6.2 Arsitektur

- Frontend → `POST /api/chatbot` (Express) → Gemini `generateContent` dengan
  `responseSchema` (JSON terstruktur) → Express mencocokkan spesialisasi ke pengacara
  di Supabase → respons ke frontend.
- **API key hanya di `backend/.env`** (`GEMINI_API_KEY`) dan tidak pernah dikirim ke browser.
- Model diatur lewat `GEMINI_MODEL` (default `gemini-3.5-flash-lite`).
- **Fallback:** tanpa API key, atau bila Gemini gagal/timeout (15 detik), backend memakai
  klasifikasi kata kunci yang sudah diperbaiki, sehingga chatbot tetap berfungsi.
- Riwayat percakapan chatbot tidak disimpan di server. Hanya 10 pesan terakhir yang
  dikirim ke Gemini. Endpoint dibatasi 20 request per menit per IP.

### 6.3 Kriteria penerimaan

- [ ] Kasus uji §6.4 diarahkan ke spesialisasi yang benar.
- [ ] Kartu pengacara yang direkomendasikan bisa diklik menuju profil.
- [ ] Tanpa `GEMINI_API_KEY`, chatbot tetap menjawab (mode fallback ditandai di UI).

### 6.4 Kasus uji

| Cerita pengguna | Spesialisasi yang diharapkan |
| --- | --- |
| "Suami saya sering memukul saya di rumah" | Hukum Pidana (urgensi tinggi) |
| "Saya ingin bercerai dan mengurus hak asuh anak" | Hukum Keluarga |
| "Saya di-PHK tanpa pesangon" | Hukum Ketenagakerjaan |
| "Sertifikat tanah saya dipakai orang lain" | Hukum Properti |
| "Pembagian harta peninggalan orang tua tidak adil" | Hukum Waris |
| "Teman meminjam uang dan tidak mau membayar" | Hukum Perdata |
| "Mitra bisnis melanggar perjanjian kerja sama usaha" | Hukum Bisnis |

---

## 7. Model data (Supabase) — migration `004_points_chat.sql`

| Tabel | Kolom utama | Catatan |
| --- | --- | --- |
| `lawyer_profiles` (+kolom) | `rate_points`, `is_online` | Tarif & ketersediaan pindah dari localStorage |
| `wallets` | `user_id` PK, `balance ≥ 0` | Satu baris per user, dibuat otomatis |
| `point_transactions` | `type` (`TOP_UP`/`CONSULTATION_PAYMENT`/`REFUND`/`EARNING`), `amount`, `balance_after`, `request_id` | Ledger append-only, unik `(user_id, request_id)` |
| `consultations` | `customer_id`, `lawyer_id`, `rate`, `status`, `brief`, `started_at`, `ended_at` | Unik: satu aktif per pasangan customer–pengacara |
| `consultation_messages` | `consultation_id`, `sender_id`, `body` | Index `(consultation_id, created_at)` |
| `reviews` | `consultation_id` unik, `rating 1–5`, `body` | Rating pengacara dihitung dari tabel ini |

Keamanan sama dengan tabel yang sudah ada: RLS aktif, tanpa kebijakan tulis untuk
`anon`/`authenticated`. Semua tulis lewat Express memakai service role dan fungsi
`security definer` yang hanya boleh dieksekusi `service_role`.

## 8. API baru (`/api`)

| Method | Endpoint | Akses |
| --- | --- | --- |
| GET | `/wallet` | Login: saldo + 50 transaksi terakhir |
| POST | `/wallet/topup` | Customer: `{amount, method, request_id}` |
| GET | `/consultations` | Login: milik sendiri (admin: semua) |
| POST | `/consultations` | Customer: `{lawyer_id, brief, request_id}` |
| GET | `/consultations/:id` | Peserta/admin: detail + ulasan |
| PATCH | `/consultations/:id/status` | `{status}` sesuai siklus §4.2 |
| GET | `/consultations/:id/messages` | Peserta/admin |
| POST | `/consultations/:id/messages` | Peserta, status `Ongoing`: `{id, body}` |
| POST | `/consultations/:id/review` | Customer pemilik, status `Completed` |
| GET | `/lawyers/:id/reviews` | Publik |
| GET | `/admin/transactions` | Admin |
| POST | `/chatbot` | Publik (rate limited) |

`PUT /profile/me` juga menerima `rate_points` dan `is_online` untuk pengacara.

## 9. Perbaikan desain & kode (Ponytail)

- Palet warna: **tetap warm pastel** (cokelat/krem) sesuai keputusan pemilik proyek
  (v1.1). Rencana awal beralih ke "Pastel Legal Trust" dibatalkan.
- Hapus kode mati: `src/context/HiLawContext.tsx`, `src/data/mockData.ts`,
  `src/types/hilaw.ts` (tidak diimpor di mana pun), serta ledger/simulasi localStorage
  yang digantikan backend.
- Hapus ulasan palsu yang ditulis langsung di halaman profil pengacara.
- Riwayat chatbot tidak lagi disimpan di `localStorage` (cerita hukum bersifat sensitif).
- Halaman Pengaturan Admin menampilkan pengaturan akun; pengaturan "nama platform" lama
  hanya tersimpan di browser admin sendiri sehingga dihapus.
- Pulihkan checkbox "Ingat saya" dan pemberitahuan pengajuan ulang verifikasi
  (2 tes yang gagal).
- Lint 0 error.

## 10. Di luar cakupan (fase berikutnya)

- Midtrans mode production (perlu verifikasi bisnis); saat ini sandbox untuk demo.
- Voice/video call (WebRTC) dan Legal Resume.
- Penarikan (withdraw) poin pengacara ke rekening.
- Konsultasi voice/video call (paket saat ini hanya chat); notifikasi push/email.
- Supabase Realtime sebagai pengganti polling.

## 11. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Kuota/biaya Gemini habis | Fallback kata kunci + rate limit per IP |
| Jawaban AI terdengar seperti nasihat hukum final | System prompt + disclaimer permanen di UI |
| Data sensitif diketik ke chatbot | Peringatan di UI, riwayat tidak disimpan server |
| Polling membebani server bila pengguna banyak | Interval 3 detik hanya saat tab terlihat; upgrade ke Supabase Realtime |
