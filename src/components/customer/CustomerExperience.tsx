"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowRight,
  Coins,
  CircleCheck,
  History,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCoins } from "@/store/CoinProvider";
import {
  COIN_PACKAGES,
  PAYMENT_METHODS,
  rupiah,
  transactionLabel,
  type CoinTransaction,
  type ConsultationStatus,
  type CustomerConsultation,
  type PaymentMethod,
} from "@/store/coinLedger";

export function localDate(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
}

export function Status({ status }: { status: ConsultationStatus }) {
  return (
    <span className={"consult-status status-" + status.toLowerCase()}>
      {status}
    </span>
  );
}

function TransactionTable({
  transactions,
}: {
  transactions: CoinTransaction[];
}) {
  return transactions.length ? (
    <div className="table-scroll">
      <table className="coin-table">
        <thead>
          <tr>
            <th>Tanggal (WIB)</th>
            <th>Transaksi</th>
            <th>Poin</th>
            <th>Status</th>
            <th>Saldo setelah</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{localDate(t.createdAt)}</td>
              <td>
                <strong>{transactionLabel[t.type]}</strong>
                <small>{t.description}</small>
                {t.method && <small>{t.method}</small>}
              </td>
              <td className={t.coins > 0 ? "coin-credit" : ""}>
                {t.coins > 0 ? "+" : ""}
                {t.coins}
              </td>
              <td>
                <span className="consult-status status-completed">
                  Berhasil
                </span>
              </td>
              <td>{t.balanceAfter} Poin</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="customer-empty">
      <History size={30} />
      <h3>Belum ada transaksi</h3>
      <p>Top up atau pembayaran konsultasi Anda akan muncul di sini.</p>
      <Link className="text-link" href="/customer/top-up">
        Top Up Poin <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function ConsultationList({
  consultations,
}: {
  consultations: CustomerConsultation[];
}) {
  const [selected, setSelected] = useState<CustomerConsultation | null>(null);

  return (
    <>
      {consultations.length ? (
        <div className="consultation-list">
          {consultations.map((c) => (
            <article key={c.id}>
              <div className="consultation-icon">
                <MessageCircle size={22} />
              </div>
              <div className="consultation-info">
                <h3>{c.lawyerName}</h3>
                <p>
                  {c.specialty} · Chat {c.duration} menit
                </p>
                <small>{localDate(c.createdAt)}</small>
              </div>
              <div className="consultation-actions">
                <Status status={c.status} />
                <strong>{c.rate} Poin</strong>
                <button className="text-link" onClick={() => setSelected(c)}>
                  Lihat detail <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="customer-empty">
          <MessageCircle size={30} />
          <h3>Belum ada konsultasi</h3>
          <p>Temukan pengacara yang sesuai untuk memulai langkah Anda.</p>
          <Link href="/lawyers" className="button outline">
            Cari Pengacara
          </Link>
        </div>
      )}
      {selected && (
        <Modal title="Detail konsultasi" onClose={() => setSelected(null)}>
          <Status status={selected.status} />
          <h3 className="modal-lawyer">{selected.lawyerName}</h3>
          <p>
            {selected.specialty} · Chat {selected.duration} menit
          </p>
          <dl className="account-details">
            <div>
              <dt>Tanggal (WIB)</dt>
              <dd>{localDate(selected.createdAt)}</dd>
            </div>
            <div>
              <dt>Biaya</dt>
              <dd>
                {selected.rate} Poin · {rupiah(selected.rate)}
              </dd>
            </div>
            <div>
              <dt>Keterangan</dt>
              <dd>{selected.brief}</dd>
            </div>
          </dl>
          <p className="payment-info">
            {selected.status === "Pending"
              ? "Pembayaran berhasil. Menunggu konfirmasi pengacara. Anda dapat membatalkan permintaan dan menerima refund dari ruang konsultasi."
              : selected.status === "Completed"
                ? "Konsultasi telah selesai. Buka ruang konsultasi untuk membaca riwayat chat."
                : "Buka ruang konsultasi untuk membaca riwayat atau melanjutkan chat."}
          </p>
          {selected.status !== "Cancelled" && (
            <Link className="button" href={"/consultations/" + selected.id}>
              Buka ruang konsultasi
            </Link>
          )}
          <button className="button outline" onClick={() => setSelected(null)}>
            Tutup
          </button>
        </Modal>
      )}
    </>
  );
}

export function CustomerExperience({ section }: { section: string }) {
  const { balance, transactions, consultations, ready, error } = useCoins();

  return !ready ? (
    error ? null : (
      <div className="loading" role="status">
        Memuat saldo dan aktivitas Anda…
      </div>
    )
  ) : section === "top-up" ? (
    <TopUp />
  ) : section === "transactions" ? (
    <section className="dashboard-panel">
      <h2>Riwayat transaksi</h2>
      <p className="panel-intro">
        Saldo tersimpan di server setelah setiap transaksi. 1 Poin = Rp1.000.
      </p>
      <TransactionTable transactions={transactions} />
    </section>
  ) : section === "consultations" ? (
    <Consultations consultations={consultations} />
  ) : (
    <>
      <div className="customer-stats">
        <div className="balance-card">
          <span>
            <Coins size={18} />
            Saldo Poin HiLaw
          </span>
          <strong>
            {balance.toLocaleString("id-ID")} <small>Poin</small>
          </strong>
          <p>Setara {rupiah(balance)}</p>
          <Link href="/customer/top-up" className="button">
            Top Up Poin <ArrowRight size={16} />
          </Link>
        </div>
        <div className="stat-card">
          <MessageCircle size={23} />
          <strong>
            {
              consultations.filter((c) =>
                ["Confirmed", "Ongoing"].includes(c.status),
              ).length
            }
          </strong>
          <span>Konsultasi aktif</span>
          <small>
            {consultations.filter((c) => c.status === "Pending").length}{" "}
            menunggu konfirmasi
          </small>
        </div>
        <div className="stat-card">
          <CircleCheck size={23} />
          <strong>
            {consultations.filter((c) => c.status === "Completed").length}
          </strong>
          <span>Konsultasi selesai</span>
          <Link href="/customer/consultations" className="text-link">
            Lihat riwayat <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <section className="dashboard-panel">
        <div className="customer-panel-title">
          <h2>Konsultasi terbaru</h2>
          <Link href="/customer/consultations" className="text-link">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <ConsultationList consultations={consultations.slice(0, 3)} />
      </section>
      <div className="last-lawyer dashboard-panel">
        <div>
          <span className="eyebrow">PENGACARA TERAKHIR</span>
          <h3>{consultations[0]?.lawyerName || "Temukan pendamping Anda"}</h3>
          <p>
            {consultations[0]?.specialty ||
              "Pilih pengacara sesuai kebutuhan dan anggaran Anda."}
          </p>
        </div>
        <Link
          className="button outline"
          href={
            consultations[0]
              ? "/lawyers/" + consultations[0].lawyerId
              : "/lawyers"
          }
        >
          {consultations[0] ? "Lihat Profil" : "Cari Pengacara"}
          <ArrowRight size={16} />
        </Link>
      </div>
      <section className="dashboard-panel">
        <h2>Transaksi terbaru</h2>
        <TransactionTable transactions={transactions.slice(0, 3)} />
      </section>
    </>
  );
}

function Consultations({
  consultations,
}: {
  consultations: CustomerConsultation[];
}) {
  const [filter, setFilter] = useState("all");

  return (
    <section className="dashboard-panel">
      <div className="customer-panel-title">
        <h2>Konsultasi Saya</h2>
        <label className="status-filter">
          Status
          <select
            aria-label="Filter status konsultasi"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Semua status</option>
            {["Pending", "Confirmed", "Ongoing", "Completed", "Cancelled"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <ConsultationList
        consultations={consultations.filter(
          (c) => filter === "all" || c.status === filter,
        )}
      />
    </section>
  );
}

interface PaymentConfig {
  midtrans: boolean;
  client_key?: string;
  snap_url?: string;
  sandbox?: boolean;
}
interface SnapCallbacks {
  onSuccess: () => void;
  onPending: () => void;
  onError: () => void;
  onClose: () => void;
}
declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

// Snap.js is loaded on demand, only when the customer actually pays.
function loadSnap(src: string, clientKey: string) {
  if (window.snap) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.dataset.clientKey = clientKey;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Midtrans Snap gagal dimuat. Periksa koneksi Anda."));
    document.head.appendChild(script);
  });
}

function TopUp() {
  const { balance, transactions, topUp, refresh } = useCoins();
  const params = useSearchParams();
  const [coins, setCoins] = useState<number>(100),
    [method, setMethod] = useState<PaymentMethod>("QRIS"),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState<number | null>(null),
    [gateway, setGateway] = useState<PaymentConfig | null>(null),
    [pending, setPending] = useState<string | null>(null);
  const request = useRef(""),
    locked = useRef(false);
  const midtrans = !!gateway?.midtrans;

  // Asks the backend, which asks Midtrans; points are credited only on settlement.
  const verify = (orderId: string) =>
    api<{ status: string; amount: number }>(
      "/wallet/topup/midtrans/" + encodeURIComponent(orderId),
    )
      .then(async (order) => {
        if (order.status === "settlement") {
          await refresh();
          setPending(null);
          setSuccess(order.amount);
        } else if (order.status === "pending") setPending(orderId);
        else {
          setPending(null);
          setError("Pembayaran " + order.status + ". Poin tidak ditambahkan.");
        }
      })
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    let active = true;
    api<PaymentConfig>("/payments/config", {}, false)
      .then((config) => active && setGateway(config))
      .catch(() => active && setGateway({ midtrans: false }));
    return () => {
      active = false;
    };
  }, []);

  // Redirect-based methods come back with ?order_id=... from Midtrans.
  const returnedOrder = params.get("order_id");
  useEffect(() => {
    if (returnedOrder?.startsWith("HILAW-")) void verify(returnedOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per returned order
  }, [returnedOrder]);

  function open() {
    request.current = crypto.randomUUID();
    setError("");
    setConfirm(true);
    setSuccess(null);
  }

  async function pay() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await topUp(coins, method, request.current);
      setConfirm(false);
      setSuccess(coins);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function payWithMidtrans() {
    if (locked.current || !gateway?.snap_url || !gateway.client_key) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setSuccess(null);
    try {
      const order = await api<{ order_id: string; token: string }>(
        "/wallet/topup/midtrans",
        { method: "POST", body: JSON.stringify({ amount: coins }) },
      );
      await loadSnap(gateway.snap_url, gateway.client_key);
      const done = () => void verify(order.order_id);
      window.snap!.pay(order.token, {
        onSuccess: done,
        onPending: done,
        onClose: done,
        onError: () =>
          setError("Pembayaran gagal di Midtrans. Silakan coba lagi."),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <div className="topup-balance">
        <Wallet size={28} />
        <div>
          <span>Saldo Poin HiLaw</span>
          <strong>{balance.toLocaleString("id-ID")} Poin</strong>
        </div>
        <small>1 Poin = Rp1.000</small>
      </div>
      {success !== null && (
        <div className="payment-success" role="status">
          <CircleCheck size={25} />
          <div>
            <strong>Top up {success} Poin berhasil!</strong>
            <p>
              Saldo baru telah tersimpan. Anda dapat melanjutkan memilih
              pengacara.
            </p>
          </div>
          <Link href="/lawyers" className="text-link">
            Cari Pengacara <ArrowRight size={15} />
          </Link>
        </div>
      )}
      {pending && (
        <div className="payment-info topup-pending" role="status">
          <span>
            Menunggu pembayaran Midtrans ({pending}). Selesaikan pembayaran,
            lalu cek status. Poin masuk otomatis setelah lunas.
          </span>
          <button
            className="button outline small"
            onClick={() => void verify(pending)}
          >
            Cek status pembayaran
          </button>
        </div>
      )}
      {error && !confirm && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="topup-layout">
        <section className="dashboard-panel">
          <h2>Pilih paket Poin</h2>
          <p className="panel-intro">Tanpa biaya tambahan.</p>
          <div className="coin-packages">
            {COIN_PACKAGES.map((amount) => (
              <button
                key={amount}
                className={coins === amount ? "selected" : ""}
                aria-pressed={coins === amount}
                onClick={() => {
                  setCoins(amount);
                  setSuccess(null);
                }}
              >
                <Coins size={23} />
                <strong>{amount} Poin</strong>
                <span>{rupiah(amount)}</span>
                {amount === 100 && <small>Pilihan populer</small>}
              </button>
            ))}
          </div>
          {!midtrans && (
            <label className="payment-method-label">
              Metode pembayaran simulasi
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          )}
        </section>
        <section className="dashboard-panel purchase-summary">
          <h2>Ringkasan pembelian</h2>
          <dl>
            <div>
              <dt>Paket</dt>
              <dd>{coins} Poin</dd>
            </div>
            <div>
              <dt>Metode</dt>
              <dd>{midtrans ? "Dipilih di Midtrans" : method}</dd>
            </div>
            <div>
              <dt>Biaya tambahan</dt>
              <dd>Rp0</dd>
            </div>
            <div className="summary-total">
              <dt>Total</dt>
              <dd>{rupiah(coins)}</dd>
            </div>
          </dl>
          <button
            className="button"
            disabled={!gateway || busy}
            onClick={midtrans ? payWithMidtrans : open}
          >
            {!gateway
              ? "Memuat metode pembayaran…"
              : busy && midtrans
                ? "Membuka Midtrans…"
                : midtrans
                  ? "Bayar " + rupiah(coins) + " dengan Midtrans"
                  : "Top Up " + coins + " Poin"}
            <ArrowRight size={16} />
          </button>
          <p className="demo-note">
            {midtrans
              ? gateway?.sandbox
                ? "Midtrans Sandbox: QRIS, Virtual Account, e-wallet, dan kartu. Bayar memakai simulator Midtrans, bukan uang asli."
                : "Pembayaran diproses oleh Midtrans."
              : "Pembayaran simulasi. Tidak ada uang asli yang ditagihkan."}
          </p>
        </section>
      </div>
      <section className="dashboard-panel topup-history">
        <h2>Riwayat top up</h2>
        <TransactionTable
          transactions={transactions.filter((t) => t.type === "TOP_UP")}
        />
      </section>
      {confirm && (
        <Modal
          title="Konfirmasi top up"
          busy={busy}
          onClose={() => setConfirm(false)}
        >
          <span className="tag">Simulasi pembayaran</span>
          <p className="modal-amount">
            {coins} <small>Poin HiLaw</small>
          </p>
          <p>
            Total {rupiah(coins)} melalui {method}.
          </p>
          <p className="payment-info">
            Klik tombol berikut untuk menyimulasikan pembayaran berhasil. Saldo
            hanya ditambahkan setelah Anda mengonfirmasi.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="button-row modal-buttons">
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Batal
            </button>
            <button className="button" disabled={busy} onClick={pay}>
              {busy ? "Memproses…" : "Simulasikan Pembayaran Berhasil"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
