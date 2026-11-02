"use client";

import { useEffect, useState } from "react";
import { AdminCustomers } from "./AdminCustomers";
import { BackendAdminVerifications } from "./BackendVerification";
import Link from "next/link";
import { BackendProfile } from "@/components/auth/BackendProfile";
import { useCoins } from "@/store/CoinProvider";
import { api, type ApiTransaction } from "@/lib/api";
import {
  earnings,
  rupiah,
  toTransaction,
  transactionLabel,
  type CoinTransaction,
} from "@/store/coinLedger";
import { localDate } from "@/components/customer/CustomerExperience";
import { MetricCards, SessionTable } from "./LawyerExperience";

interface Overview {
  customers: number;
  pending: number;
  customerBalance: number;
  transactions: CoinTransaction[];
}

// Admin-only numbers that are not part of the shared provider.
function useOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ total: number }>("/admin/customers?limit=1"),
      api<{ total: number }>("/admin/verifications?status=pending&limit=1"),
      api<{
        customer_balance: number;
        items: (ApiTransaction & { user_name: string })[];
      }>("/admin/transactions"),
    ])
      .then(([customers, pending, ledger]) => {
        if (active)
          setOverview({
            customers: customers.total,
            pending: pending.total,
            customerBalance: ledger.customer_balance,
            transactions: ledger.items.map(toTransaction),
          });
      })
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, []);
  return { overview, error };
}

export function AdminExperience({ section }: { section: string }) {
  if (section === "customers") return <AdminCustomers />;
  if (section === "verification" || section === "lawyers")
    return <BackendAdminVerifications />;
  if (section === "settings") return <BackendProfile />;
  return <Operations section={section} />;
}

function Operations({ section }: { section: string }) {
  const { consultations, lawyers, ready } = useCoins();
  const { overview, error } = useOverview();
  const [query, setQuery] = useState("");
  if (error)
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  if (!ready || !overview) return <p role="status">Memuat data operasional…</p>;
  const income = earnings(consultations);
  const matches = (text: string) =>
    text.toLowerCase().includes(query.toLowerCase());
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
  // Group by the lawyer recorded on each consultation, including lawyers no longer listed publicly.
  const byLawyer = [
    ...new Map(consultations.map((c) => [c.lawyerId, c.lawyerName])),
  ];

  if (section === "consultations")
    return (
      <section className="dashboard-panel">
        <h2>Kelola konsultasi</h2>
        {search}
        <SessionTable
          admin
          sessions={consultations.filter((c) =>
            matches(c.customerName + " " + c.lawyerName + " " + c.status),
          )}
        />
      </section>
    );

  if (section === "transactions") {
    const rows = overview.transactions.filter((t) =>
      matches(t.description + " " + (t.userName ?? "") + " " + t.type),
    );
    return (
      <>
        <MetricCards
          items={[
            ["Poin pada saldo Customer", overview.customerBalance],
            ...(["TOP_UP", "CONSULTATION_PAYMENT", "REFUND"] as const).map(
              (type) =>
                [
                  transactionLabel[type],
                  overview.transactions.filter((t) => t.type === type).length,
                ] as [string, number],
            ),
          ]}
        />
        <section className="dashboard-panel">
          <h2>Transaksi Poin</h2>
          <p className="panel-intro">200 transaksi terbaru.</p>
          {search}
          <div className="table-scroll">
            <table className="coin-table">
              <thead>
                <tr>
                  <th>Tanggal WIB</th>
                  <th>Akun</th>
                  <th>Transaksi</th>
                  <th>Poin</th>
                  <th>Saldo setelah</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>{localDate(t.createdAt)}</td>
                    <td>{t.userName}</td>
                    <td>
                      <strong>{transactionLabel[t.type]}</strong>
                      <small>{t.description}</small>
                    </td>
                    <td className={t.coins > 0 ? "coin-credit" : ""}>
                      {t.coins > 0 ? "+" : ""}
                      {t.coins}
                    </td>
                    <td>{t.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <p className="demo-note">Tidak ada transaksi sesuai pencarian.</p>
          )}
        </section>
      </>
    );
  }

  if (section === "reports")
    return (
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
                {byLawyer.map(([id, name]) => {
                  const e = earnings(consultations, id);

                  return (
                    <tr key={id}>
                      <td>{name}</td>
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

  return (
    <>
      <MetricCards
        items={[
          ["Total Customer", overview.customers],
          ["Pengacara terverifikasi", lawyers.length],
          ["Total konsultasi", consultations.length],
          ["Pendapatan platform", rupiah(income.platform)],
        ]}
      />
      <div className="admin-overview-grid">
        <section className="dashboard-panel">
          <h2>Distribusi status konsultasi</h2>
          <div className="status-chart">
            {["Pending", "Confirmed", "Ongoing", "Completed", "Cancelled"].map(
              (status) => {
                const count = consultations.filter(
                  (c) => c.status === status,
                ).length;

                return (
                  <div key={status}>
                    <span>{status}</span>
                    <div>
                      <i
                        style={{
                          width:
                            (consultations.length
                              ? (count / consultations.length) * 100
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
          <p>{overview.pending} pengajuan verifikasi pengacara menunggu.</p>
          <Link className="button outline" href="/admin/verification">
            Tinjau pengacara
          </Link>
        </section>
      </div>
      <section className="dashboard-panel ops-panel">
        <h2>Aktivitas konsultasi terbaru</h2>
        <SessionTable admin sessions={consultations.slice(0, 8)} />
      </section>
    </>
  );
}
