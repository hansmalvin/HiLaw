# Kumpulan Prompt Siap Pakai untuk Antigravity CLI (`agy`) — Proyek HiLaw

Gunakan prompt di bawah ini secara berurutan (atau gunakan **Prompt All-in-One**) langsung di dalam terminal `agy` Anda. Seluruh prompt sudah disesuaikan dengan **[PRD.md](../PRD.md)**, **[docs/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**, **[docs/ERD_AND_MOCK_SCHEMA.md](./ERD_AND_MOCK_SCHEMA.md)**, serta prinsip **Ponytail (YAGNI)** dan **Graphify**.

---

## Tahap A: Prompt Instalasi Graphify & Inisialisasi Next.js

Salin dan tempel prompt berikut ke dalam `agy` untuk menyelesaikan setup Graphify sekaligus menginisialisasi proyek Next.js tanpa menghapus file konteks (`BMLC.pptx`, `PRD.md`, `AGENTS.md`, `docs/`):

```text
Tolong lanjutkan tahapan di docs/ANTIGRAVITY_SETUP.md:
1. Install dan integrasikan Graphify (pip install graphifyy && graphify antigravity install), lalu jalankan graphify . untuk memetakan file konteks saat ini.
2. Inisialisasi proyek Next.js (App Router, TypeScript, Tailwind CSS, Lucide React) di folder root C:\Users\ASUS\HiLaw tanpa menghapus file yang sudah ada (BMLC.pptx, PRD.md, AGENTS.md, dan folder docs/). Jika create-next-app menolak karena folder tidak kosong, buat di subfolder sementara lalu pindahkan ke root.
3. Gunakan prinsip Ponytail (YAGNI): bersih, modular, tanpa dependensi berat yang tidak perlu.
```

---

## Tahap B: Prompt Pembuatan Aplikasi (Bisa Bertahap atau Sekaligus)

### Opsi 1: Prompt All-in-One (Langsung Buat Seluruh Tampilan Sesuai PRD)
Jika Anda ingin `agy` langsung mengerjakan seluruh prototipe tampilan dari awal sampai selesai dalam satu instruksi:

```text
Berdasarkan PRD.md, docs/DESIGN_SYSTEM.md, dan docs/ERD_AND_MOCK_SCHEMA.md, tolong bangunkan prototipe tampilan frontend Next.js (App Router + Tailwind CSS) untuk website konsultasi hukum "HiLaw" dengan acuan tampilan seperti Halodoc dan palet warna Pastel Legal Trust (#3B5BDB Royal Slate Blue, #EDF2FF Soft Periwinkle, #E64980 Pastel Rose Coral, #0CA678 Sage Emerald, #F59F00 Warm Honey Gold).

Pastikan mengikuti prinsip Ponytail (YAGNI, tanpa backend eksternal, gunakan React Context + localStorage agar state interaktif berjalan nyata) dengan fitur berikut:

1. Data & Kontrak Tipe (src/types/hilaw.ts & src/data/mockData.ts):
   - Implementasikan skema 6 entitas sesuai docs/ERD_AND_MOCK_SCHEMA.md.
   - Sediakan mock data pengacara spesialis (Hukum Bisnis, Keluarga & Waris, Perdata, Pidana, Ketenagakerjaan, Pertanahan) lengkap dengan nomor lisensi KTA PERADI/KAI, tarif LawToken (1 LawToken = Rp 1.000), rating, dan status Online.

2. Global Navigation & Role Switcher (Navbar):
   - Tampilkan logo HiLaw, badge "Terverifikasi PERADI", indikator Saldo LawToken aktif (misal 120 Token), tombol "+ Top Up Token", dan komponen Role Switcher agar saya bisa berpindah tampilan antara 3 level user (1. User Biasa/Klien, 2. User Pengacara, 3. Admin) secara instan.

3. Tampilan Level 1 - User Biasa / Klien (Acuan Halodoc):
   - Hero Banner Pastel + 4 Kartu Layanan Cepat ala Halodoc (Chat Pengacara, Janji Temu Video/Telepon, Cek Spesialis/Legal Triage, Top-Up LawToken).
   - Fitur "Interactive Legal Triage" (bantuan pilih spesialis berdasarkan masalah hukum).
   - Direktori & Filter Spesialis Pengacara dengan kartu profil bergaya Halodoc (status Online, pengalaman, persentase kepuasan, harga token transparan, tombol Chat & Video Call).
   - Modal Simulasi Pembayaran Midtrans Snap untuk Top-Up LawToken (pilihan paket token, metode QRIS, Virtual Account BCA/Mandiri/BRI, GoPay/ShopeePay, dan tombol simulasi Settlement yang langsung menambah saldo LawToken user).
   - Ruang Konsultasi Interaktif (/consultation): tampilan Live Chat, simulasi saklar Voice Call & Video Call, penghitung waktu sesi (countdown timer), dan kartu "Legal Resume" (Ringkasan Advokat/Catatan Hukum) yang bisa diunduh/dicetak.

4. Tampilan Level 2 - User Pengacara (/lawyer-dashboard):
   - Toggle status Online/Sibuk/Offline, ringkasan pendapatan LawToken & simulasi tarik dana (Withdrawal), daftar antrean konsultasi klien masuk, serta form pembuatan Legal Resume untuk dikirim ke klien.

5. Tampilan Level 3 - Admin Operasional (/admin):
   - Dashboard Key Metrics sesuai BMLC (Jumlah Pengguna Terdaftar, Tingkat Kepuasan Pelanggan/CSAT, Pendapatan Bulanan Midtrans).
   - Tabel Validasi & Verifikasi Lisensi Pengacara Baru (Approve/Reject KTA PERADI) sebagai Unfair Advantage BMLC.
   - Tabel Monitoring Log Transaksi Midtrans (Settlement, Pending, Expire) & manajemen paket LawToken.

Setelah selesai, jalankan pengecekan build/lint untuk memastikan tidak ada error TypeScript dan perbarui graf dengan graphify .
```

---

### Opsi 2: Prompt Bertahap (Step-by-Step per Modul)
Jika Anda lebih suka memantau hasil pengerjaan `agy` satu per satu:

#### **Prompt Modul 1 — Fondasi State, Mock Data, Navbar Role Switcher & Modal Midtrans**
```text
Berdasarkan docs/ERD_AND_MOCK_SCHEMA.md dan docs/DESIGN_SYSTEM.md, buatkan:
1. src/types/hilaw.ts dan src/data/mockData.ts untuk 6 entitas utama HiLaw.
2. React Context (src/context/HiLawContext.tsx) dengan penyimpanan localStorage untuk mengelola: role aktif (CLIENT | LAWYER | ADMIN), saldo LawToken, daftar transaksi Midtrans, daftar pengacara (beserta status online & verifikasi), dan sesi konsultasi aktif.
3. Komponen Navbar bergaya Halodoc dengan Role Switcher (Klien, Pengacara, Admin), widget saldo LawToken, serta komponen MidtransSnapModal.tsx untuk simulasi top-up LawToken via QRIS, Virtual Account, dan GoPay.
```

#### **Prompt Modul 2 — Tampilan User Biasa (Beranda Halodoc, Legal Triage, Direktori & Ruang Konsultasi)**
```text
Berdasarkan PRD.md dan docs/DESIGN_SYSTEM.md, buatkan tampilan untuk role CLIENT (User Biasa):
1. Beranda utama (src/app/page.tsx) bergaya Halodoc dengan palet Pastel Legal Trust, 4 Quick Action Cards, fitur Interactive Legal Triage (rekomendasi spesialis otomatis berdasarkan keluhan), dan direktori kartu pengacara dengan filter bidang keahlian serta harga LawToken transparan.
2. Halaman/panel Ruang Konsultasi (Chat, simulasi Voice Call & Video Call, timer sesi, dan kartu Legal Resume / Ringkasan Hukum pasca-konsultasi). Pastikan saat klien memulai sesi, saldo LawToken terpotong otomatis sesuai tarif pengacara.
```

#### **Prompt Modul 3 — Tampilan User Pengacara & Admin BMLC**
```text
Berdasarkan PRD.md, lengkapi tampilan untuk role LAWYER dan ADMIN:
1. Dashboard Pengacara: toggle status Online/Offline, statistik sesi & pendapatan token, antrean klien masuk, form kirim Legal Resume ke klien, dan simulasi pencairan token ke rekening.
2. Dashboard Admin: kartu KPI sesuai Key Metrics BMLC (Pengguna Terdaftar, Kepuasan Pelanggan, Pendapatan Bulanan), tabel verifikasi lisensi KTA pengacara baru (Approve/Reject yang langsung memperbarui status pengacara di state), serta tabel log transaksi Midtrans.
3. Pastikan seluruh halaman responsif, bebas error TypeScript, lalu jalankan graphify . untuk memperbarui knowledge graph.
```
