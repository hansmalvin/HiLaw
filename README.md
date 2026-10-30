# HiLaw — Frontend Prototype (Phase 1–6)

Website konsultasi hukum Next.js App Router, TypeScript, Tailwind CSS, Lucide React, dan Plus Jakarta Sans. Desain Soft Minimalist Legal: putih, cream beige, dan cokelat. Seluruh akun, verifikasi, pembayaran, konsultasi, dan percakapan adalah simulasi frontend.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Untuk produksi lokal: `npm run build`, lalu `npm start`. Build mengambil font Plus Jakarta Sans dari Google Fonts.

## Akun demonstrasi

| Role | Email | Password |
|---|---|---|
| Customer | customer@hilaw.demo | HiLaw123! |
| Pengacara Nadira | lawyer@hilaw.demo | HiLaw123! |
| Admin | admin@hilaw.demo | HiLaw123! |

Navbar menyediakan demo role switcher. Dashboard pengacara juga menyediakan pemilih akun demo untuk setiap pengacara, sehingga permintaan ke pengacara selain Nadira dapat diuji. Akun demo lain memakai email seperti aditya@hilaw.demo dengan password yang sama.

Pendaftaran publik tersedia untuk Customer dan Pengacara; Admin tidak dapat didaftarkan. Customer baru mulai dengan 0 Coins. Pengacara baru memperoleh profil Pending dan perlu diverifikasi Admin sebelum tampil di direktori. Remember Me menggunakan localStorage; session biasa menggunakan sessionStorage.

## Fitur

- Website publik: beranda, kategori, direktori dengan pencarian/filter/sorting, detail pengacara dan ulasan, chatbot berbasis keyword, serta FAQ.
- Customer: saldo Coins, paket top up 50/100/250/500, pembayaran simulasi, ringkasan dan konfirmasi pembayaran, riwayat transaksi, konsultasi berdasarkan status, detail, chat, dan ulasan setelah selesai.
- Pengacara: overview, permintaan masuk, penerimaan/penolakan, refund otomatis saat ditolak, mulai sesi, konsultasi aktif/riwayat, pendapatan 80%, dan pengeditan nama/foto/deskripsi/spesialisasi/pengalaman/tarif/ketersediaan.
- Admin: metrik, grafik distribusi status, daftar Customer dan detail, daftar pengacara dan detail, verifikasi/penolakan verifikasi, aktivasi/nonaktivasi, monitoring konsultasi, pembatalan permintaan Pending dengan refund, transaksi Coins, laporan pendapatan 20%/80%, pengaturan nama platform dan email kontak.
- Chat: pesan dan timestamp WIB, status sesi, pengirim sesuai akun, riwayat tersimpan, konfirmasi akhiri sesi, sinkronisasi antar-role dan antar-tab pada browser/origin yang sama. Admin dapat memonitor tetapi tidak dapat mengirim pesan.
- Reset Demo Data tersedia di aktivitas Customer dan Pengaturan Admin dengan konfirmasi. Reset menghapus perubahan operasional termasuk pesan dan ulasan; akun pendaftaran serta chat Assistant tetap disimpan.

## Alur demo sampai selesai

1. Login Customer. Akun demo mempunyai 120 Coins serta satu contoh konsultasi Completed.
2. Buka HiLaw Coins; pilih paket dan metode, lalu simulasikan pembayaran berhasil.
3. Cari Nadira atau pengacara tersedia lain. Isi kronologi, lalu konfirmasi pembayaran. Saldo berkurang dan konsultasi menjadi Pending.
4. Ganti role ke Pengacara. Untuk pengacara lain, pilih akun yang tepat dari pemilih akun demo.
5. Buka Permintaan Konsultasi, terima permintaan (Confirmed), lalu mulai sesi (Ongoing).
6. Buka chat dan kirim pesan. Ganti ke Customer untuk membaca dan membalas percakapan yang sama.
7. Akhiri konsultasi dari salah satu peserta. Status menjadi Completed, input chat ditutup, pendapatan masuk ke perhitungan, dan Customer dapat memberi rating/ulasan.
8. Ganti ke Admin untuk melihat konsultasi, transaksi, dan laporan pendapatan yang sama.
9. Untuk menguji refund: buat permintaan baru, lalu tolak dari akun pengacara pemiliknya. Saldo Customer kembali satu kali, status Cancelled, dan transaksi Refund muncul.
10. Untuk verifikasi: daftar sebagai Pengacara, lengkapi profil, lalu ganti ke Admin dan verifikasi akun tersebut. Login kembali dengan akun baru untuk mengatur ketersediaan.

## Aturan state dan pembayaran

1 Coin = Rp1.000. Pembagian pendapatan dihitung hanya dari konsultasi Completed: HiLaw 20%, pengacara 80%. Rate lama tetap tersimpan pada konsultasi jika tarif profil diubah. Penghasilan adalah laporan simulasi, bukan saldo yang dapat dicairkan.

Lifecycle:
`Pending → Confirmed → Ongoing → Completed`
atau `Pending → Cancelled + refund`.

Penerimaan dan mulai sesi hanya oleh pengacara pemiliknya. Kedua peserta dapat mengakhiri sesi Ongoing. Admin dapat membatalkan permintaan Pending dan memonitor percakapan. Refund, pembayaran, pesan, dan ulasan memiliki pemeriksaan duplikasi atau status. Profil nonaktif/belum terverifikasi tidak muncul di direktori dan tidak dapat menerima pesanan baru.

Store fase baru adalah satu dokumen localStorage `hilaw-coins-v1`: saldo, transaksi, konsultasi, users, lawyer profiles, pesan, ulasan, dan pengaturan. Data Phase 3 dimigrasikan dengan menambahkan bagian platform tanpa menghapus saldo/transaksi/konsultasi. Akun pendaftaran disinkronkan tanpa menyalin digest password ke store operasional.

Perubahan dipersist sebelum UI diperbarui. Jika penyimpanan gagal, perubahan tidak diterapkan ke tampilan. Web Locks menyerialkan transaksi antar-tab bila didukung; gunakan satu tab untuk transaksi pada browser tanpa Web Locks. Storage events menyegarkan data antar-tab. Refresh dan pergantian role tetap membaca store yang sama.

Tidak ada backend, database, payment gateway, AI API, atau WebSocket. Session, akses, dan penyimpanan browser hanya simulasi dan dapat diubah melalui developer tools. Gunakan data/password khusus demo. Foto awal adalah ilustrasi dari pravatar.cc dengan fallback inisial; unggahan profil menerima PNG/JPEG/WebP maksimum 250 KB.

## Struktur utama

- `src/components/auth/`: autentikasi mock.
- `src/components/public/PublicWebsite.tsx`: halaman dan komponen publik.
- `src/components/customer/`: wallet, booking, aktivitas dan ruang konsultasi.
- `src/components/operations/`: dashboard dan operasi pengacara/admin.
- `src/components/ui/Modal.tsx`: dialog native dengan fokus dan pembatalan.
- `src/store/coinLedger.ts`: transaksi Coins dan pembuatan konsultasi.
- `src/store/platform.ts`: kepemilikan, lifecycle, refund, profil, chat, ulasan, dan pendapatan.
- `src/store/CoinProvider.tsx`: persistensi, migrasi, sinkronisasi, dan actions.
- `src/data/publicData.ts`: seed pengacara dan kategori.
- `src/app/globals.css`: design tokens dan responsive breakpoints.

Kode prototipe awal seperti MidtransSnapModal, AdminDashboardView, dan HiLawContext dipertahankan sebagai referensi. Layout aktif tidak lagi memakai store lama. /consultation dan /lawyer-dashboard diarahkan ke rute baru.

## Validasi

```bash
npm run build
node --test tests/auth.test.cjs tests/coins.test.cjs tests/platform.test.cjs
```

Pengujian mencakup login/registrasi, persistensi, idempotensi pembayaran, pemisahan akun, kegagalan storage, serialisasi transaksi, lifecycle, refund satu kali, pembatasan role, chat, profil/verifikasi, migrasi, ulasan, dan pendapatan. Pengujian provider memakai hooks/storage pengganti; belum mencakup DOM, tampilan visual, atau interaksi browser otomatis.

Layout memuat breakpoint mobile/tablet/desktop dan mendukung prefers-reduced-motion. Uji manual yang disarankan: menu mobile, modal pada layar kecil, tabel horizontal, unggah foto, refresh saat berganti role, serta alur demo di atas.
