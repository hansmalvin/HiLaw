# HiLaw API - Express + Supabase

Backend identitas, profil, dan verifikasi. Frontend Next.js tetap di root.
Node.js 22 atau lebih baru disarankan. Tidak ada ORM atau JWT buatan sendiri.

## 1. Instalasi dan konfigurasi

Dari root proyek:

```powershell
npm install
npm install --prefix backend
Copy-Item backend/.env.example backend/.env
Copy-Item .env.local.example .env.local
```

Jangan menimpa `.env` / `.env.local` yang sudah berisi konfigurasi Anda.
Isi `backend/.env`:

```dotenv
PORT=8001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Buat proyek di Supabase Dashboard. Ambil Project URL, anon key dan service role
key dari Settings > API / API Keys. Gunakan anon key untuk operasi Supabase Auth.
Service role hanya berada di backend; jangan memakai awalan `NEXT_PUBLIC_` untuk
key ini. `.env` diabaikan Git. Startup menolak konfigurasi yang kosong/tidak valid,
dan hanya menampilkan nama variabel bermasalah, tanpa nilai key.

Isi `.env.local` di root (pertahankan variabel lain jika sudah ada):

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

Restart Next.js setelah mengubah environment. Frontend selalu menggunakan backend API. Jika variabel ini tidak diisi,
alamat default adalah `http://localhost:8001/api`. Tidak ada fallback login demo.

## 2. SQL Supabase dan private bucket

Buka Supabase > SQL Editor. Jalankan seluruh isi file berikut **sekali**, pada
proyek baru atau proyek yang belum memiliki tabel HiLaw dengan nama yang sama:

[`supabase/migrations/001_hilaw_identity_verification.sql`](supabase/migrations/001_hilaw_identity_verification.sql)

Migration membungkus perubahan dalam transaksi dan membuat:

- `profiles`: identitas, kontak, dan role; id mereferensikan `auth.users`.
- `lawyer_profiles`: data profesional dan status verifikasi saat ini.
- `lawyer_verifications`: riwayat pengajuan, dokumen privat, dan keputusan admin.
- Constraint, index, trigger timestamp, trigger pembuatan profil dari Auth.
- RLS baca untuk pemilik/admin, tanpa izin tulis langsung untuk anon/authenticated.
- RPC privat untuk update profil, submit, dan keputusan admin yang atomik.
- Bucket `lawyer-kta`, private, batas 2 MB, MIME JPG/PNG/PDF.

Periksa Storage > `lawyer-kta`: **Public harus OFF**. Tidak perlu menambah policy
public atau izin upload langsung dari frontend. Semua upload/download melalui
Express dengan service role setelah pemeriksaan autentikasi dan kepemilikan.
Dokumen tidak disimpan sebagai URL publik atau di localStorage.

SQL ini tidak membuat tabel Coins, konsultasi, pembayaran, atau chatbot.
Jangan jalankan ulang migration 001 pada tabel yang sudah terpasang. Untuk
perubahan berikutnya, buat migration bernomor baru. Tidak ada penghapusan tabel
atau konversi data localStorage otomatis.

Untuk mengizinkan pengacara approved mengedit dan mengajukan ulang, jalankan
[`supabase/migrations/003_lawyer_verification_resubmission.sql`](supabase/migrations/003_lawyer_verification_resubmission.sql)
di SQL Editor setelah migration 001. Migration ini mengganti fungsi submit tanpa
menghapus data. Instalasi baru juga perlu menjalankan migration ini.

Pendaftaran tugas kuliah tidak membutuhkan inbox atau email sungguhan. Backend
menggunakan `auth.admin.createUser` dengan `email_confirm: true`, lalu login
menggunakan email/password untuk mengembalikan session. Tidak ada email
konfirmasi yang dikirim. Format email tetap harus valid dan unik, misalnya
`mahasiswa@example.com`. Tidak perlu mengubah toggle Confirm email di dashboard
untuk endpoint signup ini. Service role tetap hanya dipakai di backend.

Password dikelola dan di-hash oleh Supabase Auth. `confirm_password` wajib cocok
dengan password saat signup, tetapi tidak disimpan di database, metadata, atau
profil. Trigger Auth tetap membuat profiles/lawyer_profiles secara atomik.

## 3. Akun Admin pertama

Daftar sebagai **customer** melalui Sign Up. Akun langsung aktif. Salin UUID akun
tersebut dari Auth > Users, lalu jalankan di SQL Editor dengan akses pemilik:

```sql
-- Ganti UUID di bawah dengan UUID akun customer Anda yang benar.
update public.profiles
set role = 'admin'
where id = '00000000-0000-0000-0000-000000000000'
  and role = 'customer';
```

UUID nol tersebut hanya placeholder; statement tidak mengubah akun lain.
Pastikan hasilnya tepat satu row. Masuk kembali ke frontend menggunakan akun ini.
Jangan menaruh password/key dalam SQL. Registrasi publik, perubahan metadata Auth,
atau PUT profil tidak bisa menaikkan role menjadi admin. Middleware mengambil
role terbaru dari tabel `profiles`, bukan body maupun metadata yang bisa diedit
pengguna. Role switcher dan akun demo sudah dihapus dari UI;
untuk mengganti role, logout dan masuk memakai akun lain.

## 4. Menjalankan aplikasi

Terminal 1, dari root:

```powershell
npm run dev --prefix backend
```

Terminal 2, dari root:

```powershell
npm run dev
```

Backend: `http://localhost:8001`. Frontend: `http://localhost:3000`.
Backend production build:

```powershell
npm run typecheck --prefix backend
npm run build --prefix backend
npm run start --prefix backend
```

`FRONTEND_URL` harus cocok dengan origin browser. Jangan mengaktifkan trust proxy
secara sembarang. Bila memakai reverse proxy, konfigurasikan jumlah hop tepercaya
secara khusus di deployment agar rate limiter tetap mengenali IP dengan benar.

## 5. Kontrak API

Base URL: `/api`. Response sukses:

```json
{ "success": true, "message": "Berhasil", "data": {} }
```

Response error tidak berisi stack trace:

```json
{
  "success": false,
  "message": "Periksa data yang dikirim.",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

Untuk endpoint privat kirim `Authorization: Bearer <access_token>` Supabase.
Status umum: 200 sukses, 201 signup/submit, 400 validasi, 401 sesi, 403 role atau
kepemilikan, 404 resource, 409 transisi/duplikat, 413 ukuran JSON, 429 rate limit,
502 layanan Supabase. File terlalu besar menghasilkan 400.

| Method | Endpoint                                              | Akses                                    |
| ------ | ----------------------------------------------------- | ---------------------------------------- |
| GET    | `/health`                                             | Publik                                   |
| POST   | `/auth/signup`                                        | Publik, customer/lawyer                  |
| POST   | `/auth/signin`                                        | Publik                                   |
| POST   | `/auth/refresh`                                       | Refresh token                            |
| GET    | `/auth/me`                                            | Login                                    |
| POST   | `/auth/signout`                                       | Login                                    |
| GET    | `/profile/me`                                         | Login                                    |
| PUT    | `/profile/me`                                         | Login, profil sendiri                    |
| DELETE | `/profile/me`                                         | Login, password dan konfirmasi           |
| GET    | `/lawyers`                                            | Publik, hanya approved dan field publik  |
| GET    | `/lawyer/verification`                                | Lawyer, data dan seluruh riwayat sendiri |
| POST   | `/lawyer/verification`                                | Lawyer, status not_submitted             |
| PUT    | `/lawyer/verification`                                | Lawyer, status rejected atau approved    |
| GET    | `/lawyer/verifications/:id/document`                  | Lawyer pemilik                           |
| GET    | `/admin/verifications?status=pending&page=1&limit=25` | Admin                                    |
| GET    | `/admin/verifications/:id`                            | Admin                                    |
| GET    | `/admin/verifications/:id/document`                   | Admin                                    |
| PATCH  | `/admin/verifications/:id/approve`                    | Admin                                    |
| PATCH  | `/admin/verifications/:id/reject`                     | Admin                                    |

`GET /health` mengembalikan:

```json
{ "success": true, "message": "HiLaw API is running" }
```

### Signup dan signin

`POST /auth/signup`, JSON:

```json
{
  "full_name": "Pengacara Demo",
  "email": "lawyer@example.com",
  "password": "DemoPass123!",
  "confirm_password": "DemoPass123!",
  "phone": "081234567890",
  "role": "lawyer"
}
```

Gunakan password Anda sendiri. Contoh ini bukan akun yang otomatis dibuat.
`POST /auth/signin`, JSON:

```json
{ "email": "lawyer@example.com", "password": "DemoPass123!" }
```

Response signin berisi `{session, profile}`. Session mengikuti Supabase Auth
(`access_token`, `refresh_token`, `expires_at`, dll). `profile` berisi id,
full_name, email, phone, role, avatar_url, dan `lawyer_profile` bila relevan.
`GET /auth/me` juga memberikan `verification_status` untuk lawyer.
Jangan mengirim ulang seluruh session atau profile sebagai request perubahan.

`POST /auth/refresh`: `{"refresh_token":"<refresh_token>"}`.
API client terpusat memperbarui session sebelum access token kedaluwarsa.
Frontend menyimpan hanya token sesi (sessionStorage secara default; localStorage
bila Remember Me dipilih); identitas dan role selalu dibaca ulang dari backend.
Password, data KTA dan profil bukan sumber autentikasi localStorage di mode ini.

Signout memakai `auth.admin.signOut(accessToken, "local")` untuk mencabut refresh
session pengguna saat ini. Menghapus token di browser saja tidak mencabut sesi
server. Sebaliknya pencabutan refresh session tidak membatalkan access JWT yang
sudah terbit sebelum expiry. Gunakan access token lifetime yang sesuai di
Supabase. UI menghapus token setelah pencabutan berhasil; bila gagal, error
terlihat agar pengguna dapat mencoba lagi.

### Profil

`PUT /profile/me`, JSON:

```json
{
  "full_name": "Nama Customer Baru",
  "phone": "081234567891",
  "avatar_url": null
}
```

Email dan role tidak dapat diubah. Foto profil mendukung URL HTTPS atau null.
Lawyer dapat mengubah `bio` (maksimal 2000 karakter), kontak, dan foto, sedangkan
nama, spesialisasi, KTA, organisasi, dan pengalaman mengikuti verifikasi. Nama
lawyer tidak bisa diedit melalui PUT profil untuk menghindari bypass verifikasi.

`DELETE /profile/me`, JSON:

```json
{ "confirmation": "DELETE", "password": "<password akun saat ini>" }
```

Endpoint selalu menentukan pemilik dari access token, memverifikasi ulang
password, menghapus objek KTA melalui Storage API lalu akun Auth. FK cascade
menghapus profil dan riwayat; reviewer yang dihapus menjadi null pada riwayat
akun lain. Storage dan Auth bukan satu transaksi lintas layanan: jika penghapusan
Auth gagal setelah file dihapus, akun tetap ada tetapi file perlu diunggah ulang.
Jangan menghapus objek Storage dengan DELETE SQL. Data simulasi Coins/konsultasi
pada browser tidak termasuk tabel backend dan resetnya tetap lewat Reset Demo.

### Form verifikasi

Kirim multipart/form-data dengan lima field teks berikut dan satu file:

- `full_name`: 2-100 karakter.
- `kta_number`: 1-100 karakter.
- `organization`: PERADI, KAI, AAI, IKADIN, IPHI, HAPI, Lainnya.
- `specialization`: salah satu kategori pada frontend.
- `experience_years`: bilangan bulat 0-60.
- `kta_file`: JPG, PNG, PDF, maksimal 2 MB; wajib untuk setiap pengajuan.

Nama file asli tidak dipakai sebagai path; backend membuat UUID di folder milik
user. MIME dan signature isi diperiksa. Gunakan dokumen fiktif, bukan KTA asli.
Path disimpan di riwayat. Jika RPC gagal, upload baru dibersihkan; kegagalan
cleanup dicatat agar objek orphan bisa diperiksa operator.

Alur: `not_submitted -> pending -> approved/rejected`. Setelah rejected atau
approved, PUT menambah pengajuan baru dan mengembalikan status profil menjadi
pending, tanpa menimpa keputusan sebelumnya. Pengacara approved dapat membuka
modal **Edit & Ajukan Ulang** di halaman profil; membuka atau membatalkan modal
tidak mengubah status. Setiap pengajuan memerlukan unggahan KTA kembali. Pending
tidak bisa diedit atau diajukan ulang. Hanya data approved muncul di direktori publik. Sebelum approved,
penerimaan konsultasi simulasi juga diblokir frontend; backend konsultasi belum
ada dan belum menjamin transaksi konsultasi nyata.

Approve tidak memerlukan body. Reject memerlukan JSON:

```json
{ "rejection_reason": "Nomor KTA demonstrasi belum sesuai dengan file." }
```

Fungsi PostgreSQL mengunci lawyer profile lalu pengajuan; status harus pending.
Status riwayat dan profil diperbarui dalam transaksi yang sama. Unique partial
index membatasi satu pending per lawyer. Dua admin tidak bisa menyimpan dua
keputusan berbeda untuk pending yang sama. Fungsi mutasi hanya bisa dipanggil
service_role; actor id selalu dipasok backend dari token tervalidasi.

Dokumen diunduh melalui endpoint privat, bukan public URL. Tombol UI memuat Blob
setelah otorisasi lalu menyediakan tautan Buka gambar/PDF pada tab baru. Blob URL
dicabut saat komponen dilepas. Response memakai `Cache-Control: no-store`.

## 6. Integrasi frontend dan fitur yang masih mock

`src/lib/api.ts` merupakan API client terpusat. `AppAuthProvider` selalu memakai autentikasi backend. `BackendAuthProvider`, `BackendProfile`, `BackendVerification`,
`BackendAdminVerifications`, dan `AppCoinProvider` menyesuaikan kontrak API ke UI.
Tidak perlu memasang Supabase SDK di frontend atau membuka service role key.

Autentikasi, profil, status/riwayat/dokumen verifikasi, keputusan Admin, dan daftar
pengacara approved dibaca dari API melalui backend API. Data terkait tidak
disalin ke penyimpanan ledger lokal. Data demo lama tidak otomatis dimigrasikan
atau dihapus. Daftarkan akun baru di Supabase; akun `@hilaw.demo` lama bukan akun
Supabase dan tidak dapat digunakan di mode backend.

Tetap mock/local: saldo Coins, top-up, pembayaran, konsultasi, chat, pendapatan,
ulasan, chatbot, pengaturan platform, metrik operasional lainnya.
Tarif dan ketersediaan tetap preferensi simulasi lokal; rating pengacara backend
mulai 0 karena belum ada tabel ulasan. Reset Demo tidak menghapus akun atau data
Supabase. Dashboard admin Verifikasi/Kelola Pengacara menggunakan daftar riwayat
API dengan filter dan pagination; tab operasional lain belum mempunyai API.

## 7. Pengujian

```powershell
npm run typecheck --prefix backend
npm run build --prefix backend
npm run test --prefix backend
npx tsc --noEmit
node --test tests/auth.test.cjs tests/coins.test.cjs tests/platform.test.cjs
node --test tests/verification.test.cjs
```

Tes backend memeriksa Zod, signature upload, route HTTP Express, header keamanan,
CORS, penolakan token/role, dan validasi mutasi. Transport Supabase pada tes HTTP
adalah test double; tes ini tidak membuktikan koneksi atau konfigurasi proyek
Supabase, RLS, trigger SQL, transaksi nyata, dan upload live. Jalankan SQL dan
skenario di bawah pada proyek Supabase Anda untuk verifikasi penuh.

Setelah migration 003, pemeriksaan transaksi SQL opsional tersedia di
[`supabase/tests/verification_resubmission.sql`](supabase/tests/verification_resubmission.sql).
Jalankan melalui SQL Editor sebagai pemilik proyek. Tes membuat akun fiktif,
memeriksa approved -> pending, keputusan lama, blokir pending ganda, serta
reject/ajukan ulang/approve. Seluruh fixture dibatalkan dengan `rollback`.

Skenario manual setelah konfigurasi:

1. Periksa health. Signup customer dan lawyer memakai email fiktif valid; langsung login tanpa email konfirmasi.
2. Login customer, edit kontak, refresh halaman, cek perubahan bertahan.
3. Login lawyer; buka Profil Pengacara; submit KTA demonstrasi. Status pending.
4. Coba submit lagi saat pending; server harus menolak 409.
5. Login admin; filter pending, buka detail dan dokumen privat.
6. Reject dengan alasan; login lawyer dan ajukan ulang. Dua riwayat tetap ada.
7. Approve pengajuan terakhir; cek Cari Pengacara dan profil lawyer.
8. Edit pengacara approved dan kirim ulang: pengajuan baru pending, keputusan lama tetap approved, tidak tampil di Cari Pengacara sampai disetujui lagi. Membatalkan edit tidak mengubah status. Coba role/admin melalui profil; ditolak.
9. Dengan dua akun lawyer, coba id dokumen akun lain; harus 403.
10. Dengan dua sesi admin, kirim keputusan bersamaan; hanya satu boleh berhasil.
11. Test JPG/PNG/PDF valid, tipe palsu, dan file lebih dari 2 MB.
12. Hapus akun uji dengan password dan DELETE; cek Auth, tabel, dan Storage.

Referensi resmi:
[Supabase Auth sessions](https://supabase.com/docs/guides/auth/sessions),
[Admin signOut](https://supabase.com/docs/reference/javascript/auth-admin-signout),
[Private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Diagnosis akun tidak muncul

Akun yang dahulu dibuat melalui demo hanya ada di browser dan tidak otomatis
menjadi akun Supabase. Daftarkan ulang melalui Sign Up tanpa konfirmasi email, lalu periksa Auth > Users
dan tabel profiles. Lawyer juga akan mendapat row lawyer_profiles dari trigger.
Password hash demo tidak bisa dipakai sebagai password Supabase.

Jalankan pengecekan baca-saja (tidak menampilkan key atau identitas pengguna):

```powershell
node backend/scripts/check-connection.mjs
```

Script memeriksa koneksi, jumlah row tiga tabel, private bucket, dan jumlah akun
Auth. Tidak membuat akun uji atau mengubah data Supabase. Frontend `.env.local`
sudah dibuat untuk API lokal. Backend membaca `.env` dari folder backend walau
dijalankan dari root proyek.

### Smoke test signup langsung ke Supabase

```powershell
npm run build --prefix backend
node backend/scripts/test-signup.mjs
```

Script membuat satu akun sementara dengan email fiktif, mengecek session,
penyimpanan profiles, validasi confirm_password, dan Sign In tanpa email.
Akun sementara dihapus kembali pada cleanup. Tidak menggunakan akun pengguna
atau menyimpan password uji di file.

## Membuat akun admin melalui script backend

```powershell
npm run create-admin --prefix backend
```

Script membuat atau memperbarui `admin@gmail.com` dengan password default
`hilaw123` untuk tugas kuliah. Jika admin sudah ada, password diperbarui sesuai
konfigurasi tanpa membuat akun duplikat. Email langsung aktif.
Pendaftaran publik tetap tidak menerima role admin. Untuk email lain, set
`HILAW_ADMIN_EMAIL` dan `HILAW_ADMIN_PASSWORD` pada environment terminal sebelum menjalankan script.

## Kelola Customer oleh Admin

Halaman `/admin/customers` sekarang memakai data Supabase, dengan pagination,
tombol muat ulang, data kontak, tanggal pendaftaran, dan waktu login terakhir
(WIB). Waktu login terakhir berasal dari Supabase Auth `last_sign_in_at`; ini
bukan indikator bahwa pengguna sedang online.

- `GET /api/admin/customers?page=1&limit=25`: hanya Admin; maksimal 50 per halaman.
- `DELETE /api/admin/customers/:id`: hanya Admin, JSON `{"confirmation":"DELETE"}`.

Admin harus mengetik DELETE pada dialog konfirmasi. Penghapusan hanya menerima
akun customer; Admin, Lawyer, dan akun admin sendiri dilindungi. Backend menghapus
akun melalui Supabase Auth dan FK cascade menghapus profil terkait. Tidak perlu
migration SQL tambahan. Saldo dan konsultasi yang masih berupa simulasi browser
tidak diubah menjadi tabel backend pada fitur ini.

Smoke test langsung dengan dua akun sementara (dibersihkan sesudah tes):

```powershell
npm run build --prefix backend
node backend/scripts/test-admin-customers.mjs
```

Manajemen customer sekarang memakai API; metrik operasional Coins/konsultasi
lain tetap simulasi.

## Upload foto profil customer

Pada Informasi Akun customer, pilih JPG/PNG maksimal 2 MB lalu Simpan profil.
Foto dipratinjau sebelum upload, disimpan di Supabase Storage, dan URL hasilnya
tersimpan di `profiles.avatar_url`. Navbar serta sidebar mengikuti foto terbaru.
Tidak ada isi foto yang disimpan di localStorage.

Endpoint: `POST /api/profile/me/avatar`, khusus customer/pengacara, multipart field
`avatar`. Backend memvalidasi MIME, signature, ukuran, dan pemilik dari token.
Foto lama dibersihkan setelah profil berhasil diperbarui. Penghapusan akun oleh
pemilik/admin juga membersihkan foto terakhir milik akun itu.

Bucket `profile-avatars` berisi foto profil publik, terpisah dari KTA privat.
Setup proyek lain melalui SQL `supabase/migrations/002_profile_avatars.sql`, atau:

```powershell
node backend/scripts/setup-avatar-storage.mjs
```

Bucket pada proyek aktif sudah dikonfigurasi. Tidak perlu mengubah tabel profil.
Tes langsung dengan akun dan foto sementara yang dibersihkan sesudah selesai:

```powershell
npm run build --prefix backend
node backend/scripts/test-avatar.mjs
```

## Foto dan modal verifikasi pengacara

Pengacara juga dapat memilih file JPG/PNG maksimal 2 MB di Informasi Akun lalu
Simpan profil. Endpoint avatar menerima customer/lawyer dan selalu memperbarui
foto milik identitas pada token. Mengganti foto tidak mengubah status verifikasi.
Tidak perlu bucket atau SQL baru; memakai `profile-avatars` yang sudah tersedia.

Pada Profil Pengacara, tombol Lihat data verifikasi membuka modal berisi data,
riwayat pengajuan, dan akses dokumen KTA. Form pengajuan tetap modal terpisah.

Smoke test foto pengacara memakai akun sementara yang dibersihkan setelah tes:

```powershell
npm run build --prefix backend
node backend/scripts/test-avatar.mjs --lawyer
```
