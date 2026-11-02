# Deploy HiLaw ke Vercel

HiLaw terdiri dari dua aplikasi dalam satu repo, jadi dibuat **dua project Vercel** dari repo yang sama:

| Project Vercel | Root Directory | Isi | URL contoh |
| --- | --- | --- | --- |
| `hilaw-api` | `backend` | Express API (Supabase + Gemini) | `https://hilaw-api.vercel.app` |
| `hilaw` | `./` (root) | Frontend Next.js | `https://hilaw.vercel.app` |

Urutannya penting: **backend dulu**, lalu frontend (butuh URL backend), lalu kembali ke backend untuk
mengisi URL frontend (CORS).

---

## 0. Persiapan (sekali)

1. **Migration Supabase lengkap.** Di Supabase > SQL Editor, pastikan migration `001` sampai `006`
   di `backend/supabase/migrations/` sudah dijalankan berurutan. Database yang sama dipakai lokal
   dan produksi.
2. **Push ke GitHub.** Vercel men-deploy dari repo Git. Perubahan ada di branch `hhans`:
   ```powershell
   git push -u origin hhans
   ```
   Vercel hanya membuat deployment **Production** dari *Production Branch* (default `master`). Branch
   lain mendapat URL Preview acak yang akan ditolak CORS. Pilih salah satu:
   - **Disarankan:** buat Pull Request `hhans → master` di GitHub lalu merge. Master tetap menjadi produksi.
   - Atau di **kedua** project Vercel: Settings → Git → **Production Branch** = `hhans`.

   Pastikan `backend/.env` dan `.env.local` **tidak** ikut ter-push (sudah ada di `.gitignore`).
   Cek dengan `git ls-files backend/.env .env.local`: hasilnya harus kosong.
3. **Akun Vercel.** Daftar di <https://vercel.com> memakai akun GitHub, lalu izinkan Vercel membaca repo HiLaw.

---

## 1. Deploy backend (`hilaw-api`)

1. Buka <https://vercel.com/new>, lalu pilih repo HiLaw dan klik **Import**.
2. **Project Name:** `hilaw-api`.
3. **Root Directory:** klik **Edit**, lalu pilih folder **`backend`**.
4. **Framework Preset:** biarkan Vercel mendeteksi **Express**. Vercel menjalankan `src/app.ts`, yang
   sudah meng-export app sebagai `export default`. Tidak perlu `vercel.json`.
5. Buka **Environment Variables** dan isi (nilai sama dengan `backend/.env` lokal):

   | Name | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `SUPABASE_URL` | `https://wrbumqcemcvuwdklzoct.supabase.co` |
   | `SUPABASE_ANON_KEY` | publishable key Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key Supabase |
   | `GEMINI_API_KEY` | key dari Google AI Studio |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
   | `FRONTEND_URL` | sementara `https://hilaw.vercel.app` (diperbaiki di langkah 3) |
   | `MIDTRANS_SERVER_KEY` | `SB-Mid-server-...` (lihat `docs/MIDTRANS_SANDBOX.md`) |
   | `MIDTRANS_CLIENT_KEY` | `SB-Mid-client-...` |
   | `MIDTRANS_IS_PRODUCTION` | `false` |

   Tanpa dua key Midtrans, top up memakai simulasi. Frontend tidak butuh key Midtrans sama sekali.

6. Klik **Deploy**. Setelah selesai, buka `https://<domain-backend>/api/health`.
   Hasil yang benar: `{"success":true,"message":"HiLaw API is running"}`.
7. Buka juga `https://<domain-backend>/api/lawyers`. Jika berisi daftar (boleh `[]`), koneksi Supabase sudah benar.

> Jika deploy gagal dengan pesan `Environment belum valid: ...`, nama variabel yang disebut belum diisi.
> Perbaiki di Settings > Environment Variables, lalu buka Deployments > **Redeploy**.

## 2. Deploy frontend (`hilaw`)

1. Buka lagi <https://vercel.com/new> dan import **repo yang sama**.
2. **Project Name:** `hilaw`. **Root Directory:** biarkan `./`. **Framework:** Next.js (terdeteksi otomatis).
3. **Environment Variables:**

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://<domain-backend>/api` (tanpa `/` di akhir) |

   Variabel `NEXT_PUBLIC_*` ditanam saat **build**. Jika nilainya diubah nanti, wajib **Redeploy**.
4. Klik **Deploy**, lalu catat domain produksinya, mis. `https://hilaw.vercel.app`.

## 3. Sambungkan CORS (kembali ke backend)

Backend hanya menerima request dari satu origin, yaitu `FRONTEND_URL`.

1. Project `hilaw-api` > **Settings > Environment Variables**: ubah `FRONTEND_URL` menjadi domain
   frontend yang persis sama, mis. `https://hilaw.vercel.app` (pakai `https`, tanpa `/` di akhir).
2. **Deployments** > titik tiga pada deployment terbaru > **Redeploy**. Perubahan env tidak berlaku
   tanpa redeploy.

## 3b. Webhook Midtrans

Di <https://dashboard.sandbox.midtrans.com> → **Settings → Payment** (atau *Configuration*):

- **Payment Notification URL:** `https://<domain-backend>/api/payments/midtrans/notification`
- **Finish Redirect URL:** `https://<domain-frontend>/customer/top-up`

Klik *Test notification*. Jika `200`, webhook sudah tersambung. Sejak itu pembayaran VA/QRIS yang
dilunasi belakangan langsung menambah Poin tanpa customer menekan "Cek status".

## 4. Akun admin

Akun admin dibuat langsung di Supabase, jadi cukup dijalankan dari laptop (memakai `backend/.env`
lokal yang menunjuk ke database yang sama):

```powershell
npm run create-admin --prefix backend
```

Output `adminApiVerified: false` normal bila backend lokal tidak sedang berjalan.

## 5. Uji produksi

1. Buka domain frontend, lalu **Sign Up** sebagai Customer di satu browser dan sebagai Pengacara di
   browser lain (atau jendela incognito).
2. Pengacara: ajukan verifikasi, lalu login Admin dan **Approve**.
3. Customer: top up lewat Midtrans (kartu `4811 1111 1111 1114`, CVV `123`, OTP `112233`), lalu cek
   saldo bertambah. Buka profil pengacara, pilih paket 15/30/60 menit, lalu bayar dengan Poin.
4. Pengacara: **Terima**, lalu **Mulai sesi**. Kedua pihak saling chat, dan hitung mundur berjalan.
5. Akhiri sesi atau tunggu waktu habis. Customer harus melihat modal ulasan bintang.
6. Buka **Chatbot**. Jawaban tanpa label "Mode cadangan" berarti Gemini aktif di produksi.

---

## Pengaturan yang disarankan

- **Region:** samakan region Function backend dengan region database Supabase (Supabase > Project
  Settings > General). Atur di project `hilaw-api` > **Settings > Functions > Function Region**,
  mis. Singapore (`sin1`) untuk Supabase `ap-southeast-1`. Setiap request API memanggil database,
  jadi jarak ini paling berpengaruh pada kecepatan.
- **Node.js:** backend butuh Node 22+. Cek di **Settings > Build and Deployment > Node.js Version**
  (pilih 22.x atau 24.x).
- **Domain sendiri:** tambahkan di Settings > Domains pada project frontend, lalu perbarui
  `FRONTEND_URL` di backend dan Redeploy.

## Batasan yang perlu diketahui

- **Preview deployment frontend** (URL acak per branch/PR) akan ditolak CORS karena backend hanya
  mengizinkan `FRONTEND_URL`. Uji di domain produksi, atau sementara isi `FRONTEND_URL` dengan URL
  preview tersebut.
- **Rate limit** (120 request/menit, chatbot 20/menit per IP) disimpan di memori tiap instance
  Function, jadi batasnya per instance, bukan global. Cukup untuk demo; untuk produksi sungguhan
  gunakan store bersama (mis. Upstash Redis).
- **Chat memakai polling** (3 detik di ruang chat, 15 detik di dashboard), sehingga setiap pengguna
  aktif menghasilkan request rutin ke Function. Untuk trafik besar, ganti ke Supabase Realtime.
- **Order Midtrans** disimpan di tabel `topup_orders`. Kredit Poin bersifat idempoten, sehingga webhook
  dan "Cek status" yang datang bersamaan tetap hanya menambah saldo sekali.
- **Secret** hanya di project `hilaw-api`. Jangan pernah membuat `NEXT_PUBLIC_GEMINI_API_KEY` atau
  `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`/`NEXT_PUBLIC_MIDTRANS_SERVER_KEY`, karena semua `NEXT_PUBLIC_*` terlihat di browser.

## Alternatif: Vercel CLI

```powershell
npm i -g vercel
vercel login

cd backend
vercel link                 # buat/hubungkan project hilaw-api
vercel env add SUPABASE_URL production   # ulangi untuk setiap variabel di langkah 1
vercel --prod

cd ..
vercel link                 # project hilaw
vercel env add NEXT_PUBLIC_API_URL production
vercel --prod
```
