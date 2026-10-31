"use client";

import { useState, type FormEvent } from "react";
import { AdminCustomers } from "./AdminCustomers";
import { BackendAdminVerifications } from "./BackendVerification";
import Link from "next/link";
import { useCoins } from "@/store/CoinProvider";
import { earnings } from "@/store/platform";
import { rupiah, transactionLabel } from "@/store/coinLedger";
import { localDate } from "@/components/customer/CustomerExperience";
import { MetricCards, SessionTable } from "./LawyerExperience";

export function AdminExperience({ section }: { section: string }) {
  const { state, ready, error } = useCoins();
  const [query, setQuery] = useState("");
  if (section === "customers") return <AdminCustomers />;
  if (section === "verification" || section === "lawyers")
    return <BackendAdminVerifications />;
  if (!ready) return <p role="status">Memuat data operasional…</p>;
  if (error && section !== "settings")
    return (
      <p className="form-error" role="alert">
        {error} Muat ulang halaman atau periksa penyimpanan browser.
      </p>
    );
  const { platform } = state,
    income = earnings(state);
  const customers = platform.users.filter((u) => u.role === "CUSTOMER");
  const transactions = state.transactions.filter((t) => {
    const u = platform.users.find((u) => u.id === t.userId);

    return (t.description + " " + (u?.name || "") + " " + t.type)
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  const search = (
    <div className="search-field ops-search">
      <input
        aria-label="Cari data"
        placeholder="Cari nama atau keterangan…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
  const revenue = (
    <>
      <MetricCards
        items={[
          ["Nilai konsultasi selesai", rupiah(income.gross)],
          ["Komisi HiLaw (20%)", rupiah(income.platform)],
          ["Hak pengacara (80%)", rupiah(income.lawyer)],
        ]}
      />
      <section className="dashboard-panel">
        <h2>Pembagian pendapatan</h2>
        <p className="panel-intro">
          Hanya sesi Completed yang dihitung. Sesi batal dan refund tidak
          menjadi pendapatan.
        </p>
        <div
          className="revenue-bar"
          role="img"
          aria-label="Pembagian 20 persen HiLaw dan 80 persen pengacara"
        >
          <span>20% HiLaw</span>
          <span>80% Pengacara</span>
        </div>
        <div className="table-scroll">
          <table className="coin-table">
            <thead>
              <tr>
                <th>Pengacara</th>
                <th>Sesi selesai</th>
                <th>Nilai konsultasi</th>
                <th>HiLaw 20%</th>
                <th>Pengacara 80%</th>
              </tr>
            </thead>
            <tbody>
              {platform.lawyers.map((l) => {
                const e = earnings(state, l.id);

                return (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{e.completed.length}</td>
                    <td>{rupiah(e.gross)}</td>
                    <td>{rupiah(e.platform)}</td>
                    <td>{rupiah(e.lawyer)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  return section === "settings" ? (
    <AdminSettings />
  ) : section === "consultations" ? (
    <section className="dashboard-panel">
      <h2>Kelola konsultasi</h2>
      {search}
      <SessionTable
        admin
        sessions={state.consultations.filter((c) =>
          (c.customerName + " " + c.lawyerName + " " + c.status)
            .toLowerCase()
            .includes(query.toLowerCase()),
        )}
      />
    </section>
  ) : section === "transactions" ? (
    <>
      <MetricCards
        items={[
          [
            "Coins pada saldo Customer",
            Object.values(state.balances).reduce((sum, n) => sum + n, 0),
          ],
          [
            "Top up",
            state.transactions.filter((t) => t.type === "TOP_UP").length,
          ],
          [
            "Pembayaran",
            state.transactions.filter((t) => t.type === "CONSULTATION_PAYMENT")
              .length,
          ],
          [
            "Refund",
            state.transactions.filter((t) => t.type === "REFUND").length,
          ],
        ]}
      />
      <section className="dashboard-panel">
        <h2>Transaksi Coins</h2>
        {search}
        <div className="table-scroll">
          <table className="coin-table">
            <thead>
              <tr>
                <th>Tanggal WIB</th>
                <th>Customer</th>
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
                    {platform.users.find((u) => u.id === t.userId)?.name ||
                      t.userId}
                  </td>
                  <td>
                    <strong>{transactionLabel[t.type]}</strong>
                    <small>{t.description}</small>
                  </td>
                  <td>
                    {t.coins > 0 ? "+" : ""}
                    {t.coins}
                  </td>
                  <td>Berhasil</td>
                  <td>{t.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!transactions.length && (
          <p className="demo-note">Tidak ada transaksi sesuai pencarian.</p>
        )}
      </section>
    </>
  ) : section === "reports" ? (
    revenue
  ) : (
    <>
      <MetricCards
        items={[
          ["Total Customer", customers.length],
          ["Total pengacara", platform.lawyers.length],
          ["Total konsultasi", state.consultations.length],
          ["Total transaksi", state.transactions.length],
          ["Pendapatan platform", rupiah(income.platform)],
        ]}
      />
      <div className="admin-overview-grid">
        <section className="dashboard-panel">
          <h2>Distribusi status konsultasi</h2>
          <div className="status-chart">
            {["Pending", "Confirmed", "Ongoing", "Completed", "Cancelled"].map(
              (status) => {
                const count = state.consultations.filter(
                  (c) => c.status === status,
                ).length;

                return (
                  <div key={status}>
                    <span>{status}</span>
                    <div>
                      <i
                        style={{
                          width:
                            (state.consultations.length
                              ? (count / state.consultations.length) * 100
                              : 0) + "%",
                        }}
                      />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              },
            )}
          </div>
        </section>
        <section className="dashboard-panel">
          <h2>Perlu ditinjau</h2>
          <p>
            {
              platform.lawyers.filter((l) => l.verification === "Pending")
                .length
            }{" "}
            pengacara menunggu verifikasi.
          </p>
          <Link className="button outline" href="/admin/verification">
            Tinjau pengacara
          </Link>
          <p className="demo-note">
            Seluruh status verifikasi dan transaksi adalah simulasi.
          </p>
        </section>
      </div>
      <section className="dashboard-panel ops-panel">
        <h2>Aktivitas konsultasi terbaru</h2>
        <SessionTable admin sessions={state.consultations.slice(0, 8)} />
      </section>
    </>
  );
}

function AdminSettings() {
  const { state, saveSettings, error: storageError } = useCoins();
  const [contact, setContact] = useState(state.platform.settings.contact),
    [name, setName] = useState(state.platform.settings.platformName),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveSettings(contact, name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="dashboard-panel">
        <h2>Pengaturan platform</h2>
        <form className="auth-form ops-form" onSubmit={save}>
          <label>
            Nama platform
            <input
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email kontak placeholder
            <input
              type="email"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </label>
          {(error || storageError) && (
            <p className="form-error" role="alert">
              {error || storageError}
            </p>
          )}
          <button disabled={busy || !!storageError} className="button">
            {busy ? "Menyimpan…" : "Simpan pengaturan"}
          </button>
        </form>
      </section>
    </>
  );
}
