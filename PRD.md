# Product Requirements Document (PRD) — HiLaw
**Platform Konsultasi Hukum Online Berbasis Spesialis (Halodoc-Inspired LegalTech)**

- **Nama Proyek:** HiLaw
- **Basis Model Bisnis:** Business Model Lean Canvas (`BMLC.pptx`)
- **Fase Saat Ini:** Fase 1 — Frontend Prototype & UI/UX Interactive Mockup (Next.js App Router + Tailwind CSS)
- **Model Monetisasi:** Top-up **LawToken** melalui Payment Gateway **Midtrans** (QRIS, Virtual Account, E-Wallet, Kartu Kredit)
- **Level Pengguna:** 3 Role (`User Biasa / Klien`, `User Pengacara / Mitra Advokat`, `Admin Operasional`)

---

## 1. Latar Belakang & Pemetaan BMLC (Business Model Lean Canvas)

Berdasarkan dokumen **BMLC HiLaw**, masyarakat umum sering kali mengalami hambatan besar ketika menghadapi masalah hukum. Berikut adalah pemetaan langsung dari BMLC ke dalam fitur produk **HiLaw**:

| Elemen BMLC | Poin pada BMLC HiLaw | Solusi Fitur di Website HiLaw (Acuan Halodoc) |
| :--- | :--- | :--- |
| **Problem** | 1. Sulit menemukan pengacara dengan cepat dan sesuai<br>2. Biaya konsultasi terlalu mahal<br>3. Konsultasi langsung memakan waktu & tenaga | 1. Direktori Spesialis Pengacara dengan filter kategori & fitur *AI Legal Triage*<br>2. Harga transparan berbasis **LawToken** mulai dari sesi mikro (30 menit)<br>3. Konsultasi instan via **Chat, Voice Call, dan Video Call** dari browser/HP |
| **Solution** | - Konsultasi hukum online (Chat, Telepon, Video Call)<br>- Pencocokan bidang keahlian pengacara<br>- Harga konsultasi transparan | - *Instant Consultation Room* seperti "Chat dengan Dokter" di Halodoc<br>- Badge keahlian spesifik (Pidana, Perdata, Keluarga, Bisnis, HKI, Ketenagakerjaan, Properti)<br>- Katalog tarif token yang jelas di setiap kartu profil pengacara |
| **Value Proposition** | - Konsultasi tanpa harus datang langsung<br>- Bebas memilih pengacara sesuai kebutuhan & anggaran | - Filter pengacara berdasarkan **Tarif Token**, **Pengalaman (Tahun)**, **Rating**, dan **Status Online** |
| **Unfair Advantage** | - Kerja sama dengan pengacara terkenal & terpercaya<br>- Validasi pengacara yang ketat | - Badge **"Terverifikasi PERADI/KAI"** & kurasi berlapis di Dashboard Admin sebelum pengacara bisa menerima klien |
| **Key Metrics** | - Jumlah pengguna terdaftar<br>- Tingkat kepuasan pelanggan (CSAT)<br>- Pendapatan per bulan | - Panel analitik Admin untuk memantau pertumbuhan user, rating ulasan bintang 1–5, dan total penjualan LawToken via Midtrans |
| **Revenue Streams** | - Biaya konsultasi antara pengacara dan pengguna | - Penjualan paket **LawToken** (Midtrans) dengan sistem bagi hasil (*platform fee* / komisi token saat sesi konsultasi selesai) |

---

## 2. Referensi Desain & Pengalaman Pengguna (Halodoc-Inspired UX)

Tampilan HiLaw mengadaptasi pola navigasi **Halodoc** yang sudah sangat familiar bagi pengguna di Indonesia, namun disesuaikan untuk konteks hukum:

1. **Hero & Quick Service Bar (Seperti Beranda Halodoc):**
   - **Kartu Utama 1 — "Chat Pengacara Sekarang":** Langsung terhubung dengan pengacara berstatus *Online* (mirip "Chat dengan Dokter").
   - **Kartu Utama 2 — "Janji Temu Video / Telepon":** Jadwalkan sesi mendalam via Video Call untuk bedah dokumen/kasus.
   - **Kartu Utama 3 — "Bantu Pilih Spesialis (Triage)":** Kuesioner singkat 3 klik bagi masyarakat awam yang bingung masalahnya masuk ranah hukum apa.
   - **Kartu Utama 4 — "Top-Up LawToken":** Akses cepat isi saldo token via Midtrans Snap.
2. **Grid Kategori Spesialis Hukum (Mirip Poli Spesialis Halodoc):**
   - Ikon pastel yang ramah untuk tiap bidang: *Hukum Keluarga & Waris*, *Hukum Pidana*, *Sengketa Bisnis & Kontrak*, *Hukum Ketenagakerjaan (PHK/PHI)*, *Pertanahan & Properti*, *Hutang Piutang & Perdata*, *Pajak & HKI*.
3. **Kartu Profil Pengacara (Doctor Card Adaptation):**
   - Foto profil profesional, nama lengkap & gelar hukum, nomor lisensi terverifikasi, lencana pengalaman (misal: `8 Tahun`), persentase kepuasan (`98% 👍`), harga dalam token (`50 Token / sesi`), dan tombol CTA **"Chat"** (aktif jika online) atau **"Jadwalkan"**.

---

## 3. Spesifikasi Fitur Berdasarkan 3 Level User

### A. Level 1: User Biasa (Klien / Masyarakat Umum)
1. **Autentikasi & Profil Klien:**
   - Login / Register (simulasi UI: Email, Google OAuth, atau Nomor WhatsApp OTP).
   - Ringkasan profil dan perlindungan privasi (opsi tampilkan nama samaran/inisial saat konsultasi sensitif).
2. **Eksplorasi & Pencarian Pengacara Spesialis:**
   - Pencarian kata kunci (nama pengacara, topik kasus seperti "perceraian", "kontrak kerja", "sengketa tanah").
   - Filter: Kategori Spesialis, Rentang Harga Token, Status (`Online Sekarang`), Tahun Pengalaman, dan Rating.
   - Halaman Detail Pengacara: Biografi singkat, Riwayat Pendidikan Hukum, Nomor KTA Advokat (tervalidasi), Ulasan Klien, dan Pilihan Paket Sesi (Chat 30 Menit / Voice Call 30 Menit / Video Call 60 Menit).
3. **Dompet LawToken & Pembayaran Midtrans:**
   - Menampilkan saldo aktif di header (contoh: `🪙 120 LawToken`).
   - Halaman / Modal **Top-Up LawToken**: Pilihan paket token (Starter, Reguler, Kasus Kompleks, Korporat) atau input nominal kustom.
   - **Simulasi Midtrans Snap Popup:** Pilihan metode pembayaran (QRIS, GoPay/ShopeePay, Virtual Account BCA/Mandiri/BRI/BNI, Kartu Kredit) beserta halaman status pembayaran (*Pending*, *Berhasil / Settlement*, *Gagal*).
4. **Ruang Konsultasi Hukum (Chat, Telepon, Video Call):**
   - **Pre-Chat Brief:** Form singkat sebelum sesi dimulai (Subjek masalah & kronologi singkat) agar waktu konsultasi efisien.
   - **Live Chat Interface:** Bubble chat, indikator *typing*, countdown timer durasi sesi (misal `29:45`), tombol **Perpanjang Sesi (+Token)**, dan fitur unggah dokumen/foto bukti.
   - **Voice & Video Call UI:** Tampilan layar panggilan suara/video terintegrasi dengan kontrol mikrofon, kamera, *screen-share* dokumen kontrak, dan indikator waktu.
   - **Ringkasan Hukum (*Legal Resume*):** Di akhir sesi, klien menerima kartu ringkasan saran hukum dari pengacara (seperti catatan resep dokter di Halodoc) yang dapat diunduh sebagai PDF.
5. **Riwayat & Ulasan:**
   - Daftar riwayat konsultasi (bisa membaca ulang *Legal Resume*).
   - Riwayat transaksi penggunaan & top-up LawToken.
   - Pemberian rating bintang (1–5) dan ulasan pasca-konsultasi.

---

### B. Level 2: User Pengacara (Mitra Advokat Spesialis)
1. **Onboarding & Verifikasi Advokat:**
   - Form pendaftaran mitra pengacara: Unggah KTA (PERADI/KAI/organisasi advokat resmi), Berita Acara Sumpah (BAS) Pengadilan Tinggi, pilihan maksimal 3 spesialisasi utama.
   - Status verifikasi akun (`Menunggu Verifikasi Admin`, `Terverifikasi`, `Perlu Revisi`).
2. **Dashboard Kerja Pengacara:**
   - **Status Toggle (Online / Istirahat / Offline):** Menentukan apakah pengacara bisa langsung menerima sesi instan.
   - **Statistik Ringkas:** Total Klien Bulan Ini, Pendapatan Token, Rating Kepuasan (`%`), dan Jam Konsultasi.
   - **Antrean Konsultasi Masuk (*Incoming Queue*):** Notifikasi permintaan chat/call baru lengkap dengan *Pre-Chat Brief* dari klien.
3. **Workspace Konsultasi & Pembuatan *Legal Resume*:**
   - Antarmuka chat/video call dari sisi pengacara.
   - Panel samping untuk menulis **Catatan & Rekomendasi Hukum (*Legal Opinion Summary*)** terstruktur (Analisis Singkat, Dasar Hukum/Pasal terkait, Langkah Selanjutnya yang Disarankan) untuk dikirim ke klien saat sesi berakhir.
4. **Manajemen Tarif & Dompet Penghasilan:**
   - Pengaturan tarif token per layanan (misal: Chat = `50 Token`, Voice Call = `80 Token`, Video Call = `120 Token`).
   - Dompet Pendapatan Pengacara: Menampilkan akumulasi token dari klien dan simulasi **Pencairan Dana (Withdrawal)** ke rekening bank pengacara.

---

### C. Level 3: Admin (Tim Operasional HiLaw)
1. **Executive Dashboard (Berbasis Key Metrics BMLC):**
   - Kartu KPI Utama: Total Pengguna Terdaftar, Pengacara Aktif & Terverifikasi, Tingkat Kepuasan Pelanggan (CSAT), dan Total Pendapatan Bulanan (Gross Merchandise Value & Pendapatan Bersih Platform).
   - Grafik tren konsultasi harian & distribusi kategori masalah hukum terbanyak.
2. **Manajemen & Validasi Pengacara (Unfair Advantage BMLC):**
   - Tabel daftar pendaftar pengacara baru.
   - Modal inspeksi dokumen lisensi (KTA & BAS) dengan tombol **Approve (Verifikasi)** atau **Reject** beserta catatan.
3. **Manajemen Paket Token & Monitoring Transaksi Midtrans:**
   - CRUD Katalog Paket LawToken (mengatur jumlah token, harga Rupiah, dan bonus token promo).
   - Tabel Log Transaksi Midtrans (`Order ID`, `Nama User`, `Metode Pembayaran`, `Nominal Rp`, `Jumlah Token`, `Status Midtrans: Settlement / Pending / Expire`).
4. **Moderasi Konsultasi & Resolusi Kendala:**
   - Daftar laporan kendala sesi (misal: pengacara tidak merespons sehingga sistem/admin melakukan *Refund Token* ke dompet klien).
   - Manajemen kategori spesialis hukum & banner edukasi di halaman utama.

---

## 4. Ide & Masukan Tambahan untuk Tampilan (Value-Add UI Ideas)

Karena fokus saat ini adalah membangun tampilan (Frontend Next.js) yang memukau dan meyakinkan:

1. **Fitur "Cek Bidang Hukum" (Interactive Legal Triage Wizard di Beranda):**
   - Banyak klien awam tidak tahu bedanya Hukum Perdata dan Pidana. Buat komponen interaktif 3 langkah di halaman depan: *"Apa masalah yang sedang Anda hadapi?"* (misal: "Rekan bisnis tidak bayar hutang" -> Sistem otomatis mengarahkan ke filter **Spesialis Perdata & Wanprestasi**).
2. **Konversi Nilai Token yang Jelas (`1 LawToken = Rp 1.000`):**
   - Agar pengguna tidak bingung saat menghitung harga, gunakan rasio psikologis yang mudah dipahami di UI: **1 Token = Rp 1.000** (contoh: Paket 50 Token = Rp 50.000, konsultasi chat mulai dari 35 Token = Rp 35.000).
3. **Badge Privasi & Kerahasiaan ("100% Rahasia & Terenkripsi"):**
   - Masalah hukum bersifat sangat sensitif. Menambahkan badge visual *"Dilindungi Kode Etik Kerahasiaan Advokat"* dan tombol **"Mode Anonim"** di ruang chat akan meningkatkan kepercayaan pengguna secara drastis dibanding kompetitor biasa.
4. **Role Switcher Floating Bar (Khusus Fase Prototipe Next.js):**
   - Karena belum ada backend, kita dapat menyediakan **Floating Demo Switcher** di pojok layar (`Mode: Klien` | `Mode: Pengacara` | `Mode: Admin` | `+ Simulasi Top-Up Midtrans`) sehingga saat presentasi atau demo, Anda bisa berpindah antar 3 level user dalam 1 klik tanpa harus login/logout berulang kali.

---

## 5. Arsitektur Teknis Fase 1 (Frontend-First Next.js)

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS + Lucide Icons
- **State Management (Mockup):** React Context + `localStorage` (sehingga saat user simulasi Top-Up Token via Midtrans Mockup, saldo token benar-benar bertambah dan berkurang saat klik "Mulai Konsultasi").
- **Backend Strategy:** *Zero-Backend / Mock Service Layer* pada Fase 1 (menggunakan data statis & state lokal sesuai struktur ERD di `docs/ERD_AND_MOCK_SCHEMA.md`, siap disambungkan ke Supabase/PostgreSQL + Midtrans Snap API asli di Fase 2).
