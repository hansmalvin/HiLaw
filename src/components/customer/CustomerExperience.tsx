"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Coins,
  CircleCheck,
  History,
  MessageCircle,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
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
            <th>Coins</th>
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
                {t.method && <small>{t.method} · Simulasi</small>}
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
              <td>{t.balanceAfter} Coins</td>
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
        Top Up Coins <ArrowRight size={15} />
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
                <strong>{c.rate} Coins</strong>
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
                {selected.rate} Coins · {rupiah(selected.rate)}
              </dd>
            </div>
            <div>
              <dt>Keterangan</dt>
              <dd>{selected.brief}</dd>
            </div>
          </dl>
          <p className="payment-info">
            {selected.status === "Pending"
              ? "Pembayaran berhasil. Menunggu konfirmasi pengacara; pengacara akan meninjau permintaan Anda."
              : selected.status === "Completed"
                ? "Konsultasi telah selesai. Buka ruang konsultasi untuk membaca riwayat chat."
                : "Buka ruang konsultasi untuk membaca riwayat atau melanjutkan chat."}
          </p>
          {["Confirmed", "Ongoing", "Completed"].includes(selected.status) && (
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
  const { user } = useAuth();
  const { state, ready, error, reset } = useCoins();
  const [resetOpen, setResetOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  if (!user) return null;
  const balance = state.balances[user.id] ?? 0,
    transactions = state.transactions.filter((t) => t.userId === user.id),
    consultations = state.consultations.filter((c) => c.customerId === user.id);

  async function resetData() {
    setBusy(true);
    setFailure("");
    try {
      await reset();
      setResetOpen(false);
    } catch (err) {
      setFailure((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!ready ? (
        <div role="status">Memuat saldo dan aktivitas Anda…</div>
      ) : (
        <>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!error &&
            (section === "top-up" ? (
              <TopUp />
            ) : section === "transactions" ? (
              <section className="dashboard-panel">
                <h2>Riwayat transaksi</h2>
                <p className="panel-intro">
                  Saldo tersimpan setelah setiap transaksi. 1 Coin = Rp1.000.
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
                      Saldo HiLaw Coins
                    </span>
                    <strong>
                      {balance.toLocaleString("id-ID")} <small>Coins</small>
                    </strong>
                    <p>Setara {rupiah(balance)}</p>
                    <Link href="/customer/top-up" className="button">
                      Top Up Coins <ArrowRight size={16} />
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
                      {
                        consultations.filter((c) => c.status === "Pending")
                          .length
                      }{" "}
                      menunggu konfirmasi
                    </small>
                  </div>
                  <div className="stat-card">
                    <CircleCheck size={23} />
                    <strong>
                      {
                        consultations.filter((c) => c.status === "Completed")
                          .length
                      }
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
                    <h3>
                      {consultations[0]?.lawyerName ||
                        "Temukan pendamping Anda"}
                    </h3>
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
            ))}
        </>
      )}
      <div className="reset-demo-row">
        <p>Seluruh saldo dan transaksi adalah simulasi frontend.</p>
        <button onClick={() => setResetOpen(true)}>
          <RotateCcw size={14} />
          Reset Demo Data
        </button>
      </div>
      {resetOpen && (
        <Modal
          title="Reset data demonstrasi?"
          busy={busy}
          onClose={() => setResetOpen(false)}
        >
          <p>
            Saldo, transaksi, konsultasi, pesan, ulasan, serta perubahan profil
            pengacara untuk seluruh akun akan direset. Akun login dan riwayat
            Assistant tetap tersimpan.
          </p>
          {failure && (
            <p className="form-error" role="alert">
              {failure}
            </p>
          )}
          <div className="button-row modal-buttons">
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setResetOpen(false)}
            >
              Batal
            </button>
            <button className="button" disabled={busy} onClick={resetData}>
              {busy ? "Mereset…" : "Reset data"}
            </button>
          </div>
        </Modal>
      )}
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

function TopUp() {
  const { user } = useAuth();
  const { state, topUp } = useCoins();
  const [coins, setCoins] = useState<number>(100),
    [method, setMethod] = useState<PaymentMethod>("QRIS"),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  const request = useRef(""),
    locked = useRef(false);
  if (!user) return null;

  function open() {
    request.current = crypto.randomUUID();
    setError("");
    setConfirm(true);
    setSuccess(false);
  }

  async function pay() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await topUp(coins, method, request.current);
      setConfirm(false);
      setSuccess(true);
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
          <span>Saldo HiLaw Coins</span>
          <strong>
            {(state.balances[user.id] ?? 0).toLocaleString("id-ID")} Coins
          </strong>
        </div>
        <small>1 Coin = Rp1.000</small>
      </div>
      {success && (
        <div className="payment-success" role="status">
          <CircleCheck size={25} />
          <div>
            <strong>Top up {coins} Coins berhasil!</strong>
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
      <div className="topup-layout">
        <section className="dashboard-panel">
          <h2>Pilih paket Coins</h2>
          <p className="panel-intro">Tanpa biaya tambahan pada simulasi ini.</p>
          <div className="coin-packages">
            {COIN_PACKAGES.map((amount) => (
              <button
                key={amount}
                className={coins === amount ? "selected" : ""}
                aria-pressed={coins === amount}
                onClick={() => {
                  setCoins(amount);
                  setSuccess(false);
                }}
              >
                <Coins size={23} />
                <strong>{amount} Coins</strong>
                <span>{rupiah(amount)}</span>
                {amount === 100 && <small>Pilihan populer</small>}
              </button>
            ))}
          </div>
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
        </section>
        <section className="dashboard-panel purchase-summary">
          <h2>Ringkasan pembelian</h2>
          <dl>
            <div>
              <dt>Paket</dt>
              <dd>{coins} Coins</dd>
            </div>
            <div>
              <dt>Metode</dt>
              <dd>{method}</dd>
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
          <button className="button" onClick={open}>
            Top Up {coins} Coins <ArrowRight size={16} />
          </button>
          <p className="demo-note">
            Pembayaran simulasi. Tidak ada uang asli yang ditagihkan.
          </p>
        </section>
      </div>
      <section className="dashboard-panel topup-history">
        <h2>Riwayat top up</h2>
        <TransactionTable
          transactions={state.transactions.filter(
            (t) => t.userId === user.id && t.type === "TOP_UP",
          )}
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
            {coins} <small>HiLaw Coins</small>
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
