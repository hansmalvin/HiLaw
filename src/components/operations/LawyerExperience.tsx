"use client";

import { BackendProfile } from "@/components/auth/BackendProfile";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCoins } from "@/store/CoinProvider";
import { Modal } from "@/components/ui/Modal";
import { BackendVerification } from "./BackendVerification";
import { Status, localDate } from "@/components/customer/CustomerExperience";
import {
  earnings,
  rupiah,
  type ConsultationStatus,
  type CustomerConsultation,
} from "@/store/coinLedger";
import {
  ArrowRight,
  CircleCheck,
  Coins,
  Inbox,
  MessageCircle,
  Percent,
  Timer,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export function MetricCards({
  items,
}: {
  items: [string, string | number, LucideIcon][];
}) {
  return (
    <div className="ops-metrics">
      {items.map(([label, value, Icon]) => (
        <div className="stat-card" key={label}>
          <Icon size={22} />
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function SessionTable({
  sessions,
  lawyer = false,
  admin = false,
}: {
  sessions: CustomerConsultation[];
  lawyer?: boolean;
  admin?: boolean;
}) {
  const { transition } = useCoins();
  const [selected, setSelected] = useState<CustomerConsultation | null>(null),
    [action, setAction] = useState<ConsultationStatus | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  async function confirm() {
    if (!selected || !action || busy) return;
    setBusy(true);
    setError("");
    try {
      await transition(selected.id, action);
      setSelected(null);
      setAction(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!sessions.length ? (
        <div className="customer-empty">
          <MessageCircle size={32} />
          <h3>Belum ada konsultasi</h3>
          <p>Aktivitas konsultasi akan muncul di sini.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="coin-table">
            <thead>
              <tr>
                <th>Tanggal (WIB)</th>
                <th>Customer / Pengacara</th>
                <th>Status</th>
                <th>Poin</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((c) => (
                <tr key={c.id}>
                  <td>{localDate(c.createdAt)}</td>
                  <td>
                    <strong>{c.customerName}</strong>
                    <small>{c.lawyerName}</small>
                  </td>
                  <td>
                    <Status status={c.status} />
                  </td>
                  <td>{c.rate}</td>
                  <td>
                    <div className="ops-actions">
                      <button
                        className="text-link"
                        onClick={() => {
                          setSelected(c);
                          setAction(null);
                          setError("");
                        }}
                      >
                        Detail
                      </button>
                      {lawyer && c.status === "Pending" && (
                        <>
                          <button
                            onClick={() => {
                              setSelected(c);
                              setAction("Confirmed");
                              setError("");
                            }}
                          >
                            Terima
                          </button>
                          <button
                            onClick={() => {
                              setSelected(c);
                              setAction("Cancelled");
                              setError("");
                            }}
                          >
                            Tolak & refund
                          </button>
                        </>
                      )}
                      {lawyer && c.status === "Confirmed" && (
                        <button
                          onClick={() => {
                            setSelected(c);
                            setAction("Ongoing");
                            setError("");
                          }}
                        >
                          Mulai sesi
                        </button>
                      )}
                      {["Ongoing", "Completed"].includes(c.status) && (
                        <Link href={"/consultations/" + c.id}>
                          {c.status === "Completed"
                            ? "Riwayat chat"
                            : "Buka chat"}{" "}
                          <ArrowRight size={13} />
                        </Link>
                      )}
                      {admin && c.status === "Pending" && (
                        <button
                          onClick={() => {
                            setSelected(c);
                            setAction("Cancelled");
                            setError("");
                          }}
                        >
                          Batalkan & refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <Modal
          title={
            action === "Cancelled"
              ? "Tolak permintaan & refund?"
              : action === "Confirmed"
                ? "Terima konsultasi?"
                : action === "Ongoing"
                  ? "Mulai sesi konsultasi?"
                  : "Detail konsultasi"
          }
          busy={busy}
          onClose={() => {
            setSelected(null);
            setAction(null);
          }}
        >
          <Status status={selected.status} />
          <h3 className="modal-lawyer">{selected.customerName}</h3>
          <p>
            {selected.lawyerName} · {selected.rate} Poin
          </p>
          <p className="payment-info">{selected.brief}</p>
          {action === "Cancelled" && (
            <p>
              {selected.rate} Poin dikembalikan satu kali ke saldo Customer.
              Pendapatan tidak dihitung untuk sesi yang dibatalkan.
            </p>
          )}
          {action === "Confirmed" && (
            <p>
              Customer akan melihat status Confirmed. Mulai sesi setelah siap
              untuk membuka chat.
            </p>
          )}
          {action === "Ongoing" && (
            <p>Chat akan terbuka untuk kedua peserta setelah sesi dimulai.</p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="button-row modal-buttons">
            <button
              className="button outline"
              disabled={busy}
              onClick={() => {
                setSelected(null);
                setAction(null);
              }}
            >
              Tutup
            </button>
            {action && (
              <button className="button" disabled={busy} onClick={confirm}>
                {busy ? "Memproses…" : "Konfirmasi"}
              </button>
            )}
            {!action && (
              <Link className="button" href={"/consultations/" + selected.id}>
                Buka konsultasi
              </Link>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

export function LawyerExperience({ section }: { section: string }) {
  const { user } = useAuth();
  const { consultations: sessions, lawyers, balance, ready, error } =
    useCoins();
  if (!ready)
    return error ? null : (
      <p className="loading" role="status">
        Memuat ruang kerja…
      </p>
    );
  const profile = lawyers.find((l) => l.userId === user?.id);
  if (!profile)
    return (
      <p className="loading" role="status">
        Menyiapkan profil pengacara…
      </p>
    );
  const income = earnings(sessions, profile.id);

  return (
    <>
      <div className="lawyer-status-bar">
        <div>
          <span className="tag">
            {profile.verification === "Verified"
              ? "Terverifikasi"
              : profile.verification === "Pending"
                ? "Menunggu verifikasi"
                : profile.verification === "Rejected"
                  ? "Verifikasi ditolak"
                  : "Belum diajukan"}
          </span>
          <span className="tag">{profile.online ? "Tersedia" : "Offline"}</span>
        </div>
      </div>
      {section === "profile" && (
        <BackendVerification key={profile.id + profile.verification} />
      )}
      {section === "profile" || section === "settings" ? (
        <BackendProfile />
      ) : section === "earnings" ? (
        <>
          <MetricCards
            items={[
              [
                "Saldo Poin Anda",
                balance.toLocaleString("id-ID") + " Poin",
                Coins,
              ],
              ["Nilai konsultasi selesai", rupiah(income.gross), CircleCheck],
              ["Penghasilan pengacara (80%)", rupiah(income.lawyer), Wallet],
              ["Komisi HiLaw (20%)", rupiah(income.platform), Percent],
            ]}
          />
          <section className="dashboard-panel">
            <h2>Rincian pendapatan</h2>
            <p className="panel-intro">
              80% tarif masuk ke saldo Poin Anda saat konsultasi Completed.
              Sesi Pending, Confirmed, Ongoing, atau Cancelled tidak dihitung.
            </p>
            <SessionTable sessions={income.completed} />
          </section>
        </>
      ) : (
        <>
          {section === "dashboard" && (
            <>
              <MetricCards
                items={[
                  ["Total konsultasi", sessions.length, MessageCircle],
                  [
                    "Permintaan baru",
                    sessions.filter((c) => c.status === "Pending").length,
                    Inbox,
                  ],
                  [
                    "Konsultasi aktif",
                    sessions.filter((c) =>
                      ["Confirmed", "Ongoing"].includes(c.status),
                    ).length,
                    Timer,
                  ],
                  [
                    "Konsultasi selesai",
                    income.completed.length,
                    CircleCheck,
                  ],
                ]}
              />
              <div className="dashboard-welcome">
                <div>
                  <h2>{rupiah(income.lawyer)}</h2>
                  <p>Penghasilan Anda · 80% dari sesi selesai.</p>
                </div>
                <Link className="button outline" href="/lawyer/earnings">
                  Lihat pendapatan
                </Link>
              </div>
            </>
          )}
          <section className="dashboard-panel ops-panel">
            <h2>
              {section === "requests"
                ? "Permintaan konsultasi"
                : section === "active"
                  ? "Konsultasi aktif"
                  : section === "history"
                    ? "Riwayat konsultasi"
                    : "Aktivitas terbaru"}
            </h2>
            <SessionTable
              lawyer
              sessions={sessions.filter((c) =>
                section === "requests"
                  ? c.status === "Pending"
                  : section === "active"
                    ? ["Confirmed", "Ongoing"].includes(c.status)
                    : section === "history"
                      ? ["Completed", "Cancelled"].includes(c.status)
                      : true,
              )}
            />
          </section>
        </>
      )}
    </>
  );
}
