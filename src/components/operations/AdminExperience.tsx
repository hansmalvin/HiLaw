"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCoins } from "@/store/CoinProvider";
import { earnings, type ManagedLawyer } from "@/store/platform";
import { rupiah, transactionLabel } from "@/store/coinLedger";
import { Modal } from "@/components/ui/Modal";
import { localDate } from "@/components/customer/CustomerExperience";
import { MetricCards, SessionTable } from "./LawyerExperience";
import { roleLabel, type DemoUser } from "@/components/auth/AuthProvider";

export function AdminExperience({ section }: { section: string }) {
  const { state, ready, error } = useCoins();
  const [query, setQuery] = useState("");
  if (!ready) return <p role="status">Memuat data operasional…</p>;
  if (error && section !== "settings")
    return (
      <p className="form-error" role="alert">
        {error} Buka Pengaturan untuk mereset data.
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
  ) : section === "customers" ? (
    <section className="dashboard-panel">
      <h2>Kelola Customer</h2>
      {search}
      <UserTable
        users={customers.filter((u) =>
          (u.name + " " + u.email).toLowerCase().includes(query.toLowerCase()),
        )}
      />
    </section>
  ) : section === "lawyers" || section === "verification" ? (
    <section className="dashboard-panel">
      <h2>
        {section === "verification"
          ? "Verifikasi pengacara"
          : "Kelola pengacara"}
      </h2>
      {search}
      <LawyerTable
        lawyers={platform.lawyers.filter(
          (l) =>
            (section !== "verification" || l.verification !== "Verified") &&
            (l.name + " " + l.specialty)
              .toLowerCase()
              .includes(query.toLowerCase()),
        )}
      />
    </section>
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

function UserTable({ users }: { users: DemoUser[] }) {
  const { state } = useCoins();
  const [selected, setSelected] = useState<DemoUser | null>(null);

  return (
    <>
      {users.length ? (
        <div className="table-scroll">
          <table className="coin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Saldo</th>
                <th>Konsultasi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{state.balances[u.id] ?? 0} Coins</td>
                  <td>
                    {
                      state.consultations.filter((c) => c.customerId === u.id)
                        .length
                    }
                  </td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => setSelected(u)}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="demo-note">Customer tidak ditemukan.</p>
      )}
      {selected && (
        <Modal title="Detail Customer" onClose={() => setSelected(null)}>
          <dl className="account-details">
            {[
              ["Nama", selected.name],
              ["Email", selected.email],
              ["Telepon", selected.phone],
              ["Role", roleLabel[selected.role]],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <button
            className="button outline modal-buttons"
            onClick={() => setSelected(null)}
          >
            Tutup
          </button>
        </Modal>
      )}
    </>
  );
}

function LawyerTable({ lawyers }: { lawyers: ManagedLawyer[] }) {
  const { state, updateLawyer } = useCoins();
  const [selected, setSelected] = useState<ManagedLawyer | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const current = selected
    ? state.platform.lawyers.find((l) => l.id === selected.id)
    : null;

  async function update(patch: Partial<ManagedLawyer>) {
    if (!current || busy) return;
    setBusy(true);
    setError("");
    try {
      await updateLawyer(current.id, patch);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {lawyers.length ? (
        <div className="table-scroll">
          <table className="coin-table">
            <thead>
              <tr>
                <th>Pengacara</th>
                <th>Spesialisasi</th>
                <th>Verifikasi</th>
                <th>Status akun</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {lawyers.map((l) => (
                <tr key={l.id}>
                  <td>
                    <strong>{l.name}</strong>
                    <small>
                      {l.experience} tahun · {l.rate} Coins
                    </small>
                  </td>
                  <td>{l.specialty}</td>
                  <td>{l.verification}</td>
                  <td>{l.active ? "Aktif" : "Nonaktif"}</td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => {
                        setSelected(l);
                        setError("");
                      }}
                    >
                      Tinjau profil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="customer-empty">
          <h3>Tidak ada pengacara untuk ditinjau</h3>
          <p>Coba pencarian lain atau buka Kelola Pengacara.</p>
        </div>
      )}
      {current && (
        <Modal
          title="Tinjau profil pengacara"
          busy={busy}
          onClose={() => setSelected(null)}
        >
          <h3>{current.name}</h3>
          <p>
            {current.specialty} · {current.experience} tahun pengalaman
          </p>
          <p className="payment-info">{current.bio}</p>
          <p>
            Verifikasi: <strong>{current.verification}</strong> · Akun:{" "}
            <strong>{current.active ? "Aktif" : "Nonaktif"}</strong>
          </p>
          <p className="demo-note">
            Peninjauan ini memakai data fiktif; tidak ada validasi dokumen
            advokat sungguhan.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="ops-actions modal-buttons">
            <button
              disabled={busy || current.verification === "Verified"}
              onClick={() =>
                update({
                  verification: "Verified",
                })
              }
            >
              Verifikasi
            </button>
            <button
              disabled={busy || current.verification === "Rejected"}
              onClick={() =>
                update({
                  verification: "Rejected",
                })
              }
            >
              Tolak verifikasi
            </button>
            <button
              disabled={busy}
              onClick={() =>
                update({
                  active: !current.active,
                })
              }
            >
              {current.active ? "Nonaktifkan akun" : "Aktifkan akun"}
            </button>
            <button disabled={busy} onClick={() => setSelected(null)}>
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function AdminSettings() {
  const { state, saveSettings, reset, error: storageError } = useCoins();
  const [contact, setContact] = useState(state.platform.settings.contact),
    [name, setName] = useState(state.platform.settings.platformName),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);

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

  async function clear() {
    setBusy(true);
    setError("");
    try {
      await reset();
      setConfirm(false);
      setName("HiLaw");
      setContact("halo@hilaw.example");
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
      <section className="dashboard-panel ops-panel">
        <h2>Data demonstrasi</h2>
        <p className="panel-intro">
          Reset saldo, konsultasi, transaksi, profil pengacara, ulasan, dan
          pesan untuk seluruh akun di browser ini. Akun pendaftaran tetap
          disimpan.
        </p>
        <button
          className="button outline"
          disabled={busy}
          onClick={() => {
            setError("");
            setConfirm(true);
          }}
        >
          Reset Demo Data
        </button>
      </section>
      {confirm && (
        <Modal
          title="Reset seluruh data demo?"
          busy={busy}
          onClose={() => setConfirm(false)}
        >
          <p>
            Semua perubahan operasional pada browser ini akan dikembalikan ke
            data awal. Tindakan ini menghapus riwayat chat konsultasi demo.
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
            <button className="button" disabled={busy} onClick={clear}>
              {busy ? "Mereset…" : "Reset data"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
