# Midtrans Sandbox untuk Top Up Poin (demo)

Kode sudah siap. Anda hanya perlu **mengisi 2 key** dan **menjalankan 1 migration**. Tanpa key,
halaman top up otomatis memakai simulasi lama, jadi aplikasi tetap bisa didemokan.

## Cara kerjanya

```
Customer pilih paket ─▶ Backend buat order (topup_orders, status pending)
                     ─▶ Midtrans Snap mengembalikan token ─▶ popup Snap di browser
Customer bayar di simulator Midtrans
   ├─▶ Popup ditutup/sukses ─▶ frontend minta backend cek status ke Midtrans
   └─▶ (di Vercel) Midtrans memanggil webhook /api/payments/midtrans/notification
Backend: status "settlement" ─▶ Poin ditambahkan SEKALI (fungsi settle_topup_order)
```

- Server Key hanya ada di backend. Client Key boleh terlihat di browser dan dikirim backend lewat
  `GET /api/payments/config`, jadi frontend **tidak** butuh env tambahan.
- Webhook diverifikasi dengan signature SHA-512, lalu status dicek ulang lewat Get Status API Midtrans.
- Saat Midtrans aktif, top up simulasi dimatikan di server, sehingga tidak ada lagi Poin gratis.

---

## 1. Buat akun & ambil key sandbox

1. Daftar di <https://dashboard.midtrans.com/register> (gratis), lalu verifikasi email.
2. Pastikan dashboard berada di mode **Sandbox** (pilih environment di kiri atas), atau buka
   langsung <https://dashboard.sandbox.midtrans.com>.
3. Buka **Settings → Access Keys**, lalu salin:
   - **Client Key**: berawalan `SB-Mid-client-...`
   - **Server Key**: berawalan `SB-Mid-server-...` (rahasia, jangan dibagikan)

## 2. Jalankan migration 006

Supabase → SQL Editor → tempel isi `backend/supabase/migrations/006_midtrans_topup.sql`, lalu Run.
Migration ini membuat tabel `topup_orders` dan fungsi `settle_topup_order`.
Tes opsional: `backend/supabase/tests/midtrans_topup.sql`. Hasil yang diharapkan adalah notice `PASS`.

## 3. Isi key di `backend/.env`

Baris kosongnya sudah tersedia:

```dotenv
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

Restart backend: `npm run dev --prefix backend`.
Cek: buka <http://localhost:8001/api/payments/config>. Hasilnya harus `"midtrans":true`.

## 4. Demo pembayaran (lokal)

1. Login sebagai **Customer** → menu **Poin HiLaw** → pilih paket → **Bayar Rp… dengan Midtrans**.
2. Popup Snap terbuka. Pilih salah satu metode di bawah:

| Metode | Cara membayar di sandbox |
| --- | --- |
| **Kartu kredit** | Nomor `4811 1111 1111 1114`, expiry `01/30` (bulan apa saja, tahun di masa depan), CVV `123`, OTP `112233`. Langsung sukses. |
| **QRIS / GoPay / ShopeePay** | Klik kanan gambar QR → *Copy image address* → buka [QRIS Simulator](https://simulator.sandbox.midtrans.com/v2/qris/index) → tempel → **Scan QR** → **Pay**. |
| **BCA Virtual Account** | Salin nomor VA → buka [BCA VA Simulator](https://simulator.sandbox.midtrans.com/bca/va/index) → tempel → **Inquire** → **Pay**. |
| **BNI VA** | [BNI VA Simulator](https://simulator.sandbox.midtrans.com/bni/va/index) |
| **BRI / Permata / lainnya** | [Open API VA Simulator](https://simulator.sandbox.midtrans.com/openapi/va/index) |

3. Setelah membayar, tutup popup bila belum tertutup. Halaman otomatis mengecek status:
   - **Lunas** → muncul "Top up … Poin berhasil" dan saldo di Navbar bertambah.
   - **Masih pending** (mis. VA belum dibayar) → muncul kotak kuning **Cek status pembayaran**. Bayar
     di simulator, lalu klik tombol tersebut.
4. Transaksi muncul di **Riwayat Transaksi** customer (keterangan "(Midtrans)") dan di
   **Admin → Transaksi Poin**.

> Kartu `4911 1111 1111 1113` mensimulasikan pembayaran **ditolak**. Saldo tidak berubah dan UI
> menampilkan pesan pembayaran gagal.

Di lokal tidak perlu webhook, karena frontend menanyakan status ke backend setelah popup ditutup.

## 5. Webhook (setelah deploy ke Vercel)

Agar pembayaran yang lunas belakangan (mis. VA dibayar setelah popup ditutup) masuk otomatis
tanpa klik "Cek status":

1. Dashboard Sandbox → **Settings → Payment** (pada sebagian akun bernama *Configuration*).
2. **Payment Notification URL**: `https://<domain-backend>/api/payments/midtrans/notification`
3. **Finish Redirect URL** (opsional): `https://<domain-frontend>/customer/top-up`
4. Simpan. Tombol *Test notification* akan dijawab `200 OK` (order uji diabaikan dengan aman).

Webhook butuh URL publik, jadi `localhost` tidak bisa dipakai. Untuk demo lokal cukup langkah 4.

## Pindah ke produksi (nanti, bukan untuk demo)

Ganti ke key **Production** dari dashboard production, set `MIDTRANS_IS_PRODUCTION=true`, dan ubah
Notification URL di dashboard production. Akun production memerlukan verifikasi bisnis oleh Midtrans.
