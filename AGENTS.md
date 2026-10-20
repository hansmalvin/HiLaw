# AGENTS.md — Konteks Proyek & Ruleset untuk HiLaw

File ini dimuat secara otomatis oleh **Antigravity CLI (`agy`)**, **Antigravity IDE**, serta diindeks oleh **Graphify** dan selaras dengan filosofi **Ponytail (YAGNI)**.

---

## 1. Ringkasan Proyek (HiLaw)
- **Deskripsi:** Website konsultasi hukum online (**HiLaw**) dengan acuan antarmuka seperti **Halodoc**, berbasis pada *Business Model Lean Canvas* (`BMLC.pptx`).
- **Fitur Utama:** Konsultasi online bersama spesialis pengacara hukum melalui **Chat, Telepon (Voice Call), dan Video Call**.
- **3 Level Pengguna (Roles):**
  1. `CLIENT` (User Biasa / Masyarakat Umum pencari konsultasi hukum)
  2. `LAWYER` (User Pengacara / Mitra Advokat terverifikasi)
  3. `ADMIN` (Tim Operasional HiLaw untuk validasi pengacara, metrik BMLC, dan monitoring transaksi)
- **Model Pembayaran:** Sistem **LawToken** (`1 LawToken = Rp 1.000`) yang dapat di-topup menggunakan simulasi Payment Gateway **Midtrans Snap** (QRIS, Virtual Account, GoPay/ShopeePay, Kartu Kredit).
- **Fase Saat Ini:** **Frontend-First (UI/UX Prototype)** menggunakan **Next.js (App Router, TypeScript) + Tailwind CSS**. Belum menggunakan backend eksternal; seluruh interaksi berjalan menggunakan state lokal (`React Context` / `localStorage`) dan mock data terstruktur.

---

## 2. Peta Dokumen Konteks (Knowledge Graph Nodes)
Sebelum menulis atau memodifikasi kode, selalu rujuk dokumen berikut:
- **[PRD.md](./PRD.md):** Spesifikasi lengkap produk, pemetaan BMLC, fitur per 3 level user, dan ide tambahan UI/UX.
- **[docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md):** Palet warna *Pastel Legal Trust*, tipografi, anatomi komponen gaya Halodoc, dan struktur rute Next.js.
- **[docs/ERD_AND_MOCK_SCHEMA.md](./docs/ERD_AND_MOCK_SCHEMA.md):** Diagram ERD simpel (6 tabel utama), alur transaksi Midtrans + LawToken, dan kontrak TypeScript (`src/types/hilaw.ts`).
- **[docs/ANTIGRAVITY_SETUP.md](./docs/ANTIGRAVITY_SETUP.md):** Panduan konfigurasi Antigravity CLI (`agy`) beserta plugin **Ponytail** dan **Graphify**.
- **Graphify Report (jika sudah di-generate):** Cek `graphify-out/GRAPH_REPORT.md` terlebih dahulu untuk memahami topologi proyek sebelum melakukan pencarian file mentah.

---

## 3. Aturan Pengembangan (Ponytail YAGNI & Frontend-First Rules)
1. **Prinsip YAGNI (Ponytail Decision Ladder):**
   - Jangan membuat abstraksi backend, ORM, atau API route kompleks yang belum dibutuhkan pada tahap tampilan ini.
   - Gunakan komponen React/Next.js yang bersih, modular, dan langsung dapat dijalankan (`npm run dev`).
   - Utamakan fitur native HTML/CSS & Tailwind utility classes sebelum menambah library pihak ketiga yang berat.
2. **Konsistensi Visual (Halodoc + Pastel Legal Trust):**
   - Gunakan warna utama **Royal Slate Blue (`#3B5BDB`)** dengan latar permukaan **Soft Periwinkle Pastel (`#EDF2FF`)**.
   - Gunakan **Pastel Rose Coral (`#E64980`)** untuk tombol aksi cepat (*"Chat Sekarang"*), **Sage Emerald (`#0CA678`)** untuk status *Online / Terverifikasi PERADI*, dan **Warm Honey Gold (`#F59F00`)** untuk elemen **LawToken**.
3. **Kemudahan Demo 3 Role:**
   - Selalu sediakan komponen **Role Switcher** di Navbar atau Floating Bar agar pengguna dapat menguji tampilan **User Biasa**, **User Pengacara**, dan **Admin** secara langsung di satu aplikasi Next.js.
