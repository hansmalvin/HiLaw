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
- **Model Pembayaran:** **Poin HiLaw** (`1 Poin = Rp 1.000`; dulu disebut LawToken/Coins). Top up lewat **Midtrans Snap Sandbox** (`docs/MIDTRANS_SANDBOX.md`) atau simulasi bila key kosong. Saldo & ledger tersimpan di Supabase.
- **Fase Saat Ini:** **Full-stack prototype**: frontend **Next.js (App Router, TypeScript) + Tailwind CSS** di root, backend **Express 5** di `backend/` dengan **Supabase** (Auth, Postgres, Storage) dan **Gemini API** untuk chatbot. Browser tidak pernah memegang service-role key atau Gemini key.
- **Menjalankan:** `npm run dev` (frontend, :3000) · `npm run dev --prefix backend` (API, :8001) · `npm run create-admin --prefix backend` (akun admin).

---

## 2. Peta Dokumen Konteks (Knowledge Graph Nodes)
Sebelum menulis atau memodifikasi kode, selalu rujuk dokumen berikut:
- **[PRD.md](./PRD.md):** Spesifikasi lengkap produk, pemetaan BMLC, fitur per 3 level user, dan ide tambahan UI/UX.
- **[docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md):** Palet warna *Pastel Legal Trust*, tipografi, anatomi komponen gaya Halodoc, dan struktur rute Next.js.
- **[backend/supabase/migrations/](./backend/supabase/migrations/):** Skema database yang berlaku (001–006). Sumber kebenaran untuk tabel, RLS, dan fungsi saldo.
- **[backend/README.md](./backend/README.md):** Setup Supabase, kontrak API, dan langkah mengaktifkan Gemini.
- **[docs/DEPLOY_VERCEL.md](./docs/DEPLOY_VERCEL.md):** Deploy frontend + backend sebagai dua project Vercel.
- **[docs/ERD_AND_MOCK_SCHEMA.md](./docs/ERD_AND_MOCK_SCHEMA.md):** ERD konseptual awal (historis; ikuti migration bila berbeda).
- **[docs/ANTIGRAVITY_SETUP.md](./docs/ANTIGRAVITY_SETUP.md):** Panduan konfigurasi Antigravity CLI (`agy`) beserta plugin **Ponytail** dan **Graphify**.
- **Graphify Report (jika sudah di-generate):** Cek `graphify-out/GRAPH_REPORT.md` terlebih dahulu untuk memahami topologi proyek sebelum melakukan pencarian file mentah.

---

## 3. Aturan Pengembangan (Ponytail YAGNI & Frontend-First Rules)
1. **Prinsip YAGNI (Ponytail Decision Ladder):**
   - Tanpa ORM atau lapisan abstraksi baru: backend memakai Express + `@supabase/supabase-js`; mutasi saldo wajib lewat fungsi Postgres atomik (lihat migration 004).
   - Gunakan komponen React/Next.js yang bersih, modular, dan langsung dapat dijalankan (`npm run dev`).
   - Utamakan fitur native HTML/CSS & Tailwind utility classes sebelum menambah library pihak ketiga yang berat.
2. **Konsistensi Visual (Halodoc + Warm Pastel):**
   - **Keputusan pemilik proyek (Nov 2026):** pakai palet **warm pastel** yang sudah ada, **bukan** palet "Pastel Legal Trust" (biru `#3B5BDB`) di `docs/DESIGN_SYSTEM.md`. Jangan mengganti palet tanpa diminta.
   - Token di `:root` pada `src/app/globals.css`: `--primary #51443b` (cokelat tua), `--secondary #968474`, `--accent #c8b8a5`, `--surface #f1ebe3`, `--border #e8e1d8`, `--muted #74675d`. Pakai `var(--primary)` dst.
   - Aksen status yang sudah dipakai: hijau sage `#edf3ed`/`#47654b` (berhasil/online), merah pastel `#faeeee`/`#9f3131` (batal/peringatan), krem emas `#fff2d3`/`#79520e` (pending).
3. **Kemudahan Demo 3 Role:**
   - Role berasal dari Supabase (`profiles.role`), jadi **jangan** menambahkan Role Switcher di UI (itu akan menjadi celah eskalasi hak akses). Untuk demo, pakai tiga akun: daftar Customer & Pengacara lewat Sign Up, dan Admin lewat `npm run create-admin --prefix backend`. Gunakan dua browser/profil berbeda untuk menguji chat customer ↔ pengacara.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
