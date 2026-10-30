"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCoins } from "@/store/CoinProvider";
import { categories } from "@/data/publicData";
import { Modal } from "@/components/ui/Modal";
import { Status, localDate } from "@/components/customer/CustomerExperience";
import { earnings, ownedLawyer, type ManagedLawyer } from "@/store/platform";
import {
  rupiah,
  type ConsultationStatus,
  type CustomerConsultation,
} from "@/store/coinLedger";
import {
  ArrowRight,
  CircleCheck,
  MessageCircle,
  Users,
  Wallet,
} from "lucide-react";

export function MetricCards({ items }: { items: [string, string | number][] }) {
  return (
    <div className="ops-metrics">
      {items.map(([label, value], i) => {
        const Icon = [Users, MessageCircle, CircleCheck, Wallet][i % 4];

        return (
          <div className="stat-card" key={label}>
            <Icon size={22} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        );
      })}
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
                <th>Coins</th>
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
            {selected.lawyerName} · {selected.rate} Coins
          </p>
          <p className="payment-info">{selected.brief}</p>
          {action === "Cancelled" && (
            <p>
              {selected.rate} Coins akan dikembalikan satu kali ke saldo
              Customer. Pendapatan tidak dihitung untuk sesi yang dibatalkan.
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
  const { user, switchLawyer } = useAuth();
  const { state, ready, error } = useCoins();
  if (!ready) return <p role="status">Memuat ruang kerja…</p>;
  if (error)
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  if (!user) return null;
  const profile = ownedLawyer(state, user);
  if (!profile) return <p role="status">Menyiapkan profil pengacara…</p>;
  const sessions = state.consultations.filter((c) => c.lawyerId === profile.id),
    income = earnings(state, profile.id);
  const demos = state.platform.lawyers.filter((l) =>
    l.userId.startsWith("demo-lawyer"),
  );

  return (
    <>
      <div className="lawyer-status-bar">
        <div>
          <span className="tag">
            {profile.verification === "Verified"
              ? "Terverifikasi"
              : profile.verification === "Pending"
                ? "Menunggu verifikasi"
                : "Verifikasi ditolak"}
          </span>
          <span className="tag">
            {profile.active ? "Akun aktif" : "Dinonaktifkan"}
          </span>
          <span className="tag">{profile.online ? "Tersedia" : "Offline"}</span>
        </div>
        {user.id.startsWith("demo-lawyer") && (
          <label>
            Akun pengacara demo
            <select
              value={profile.id}
              onChange={(e) => switchLawyer(e.target.value)}
            >
              {demos.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {section === "profile" || section === "settings" ? (
        <LawyerProfile key={profile.id} profile={profile} />
      ) : section === "earnings" ? (
        <>
          <MetricCards
            items={[
              ["Nilai konsultasi selesai", rupiah(income.gross)],
              ["Penghasilan pengacara (80%)", rupiah(income.lawyer)],
              ["Komisi HiLaw (20%)", rupiah(income.platform)],
            ]}
          />
          <section className="dashboard-panel">
            <h2>Rincian pendapatan simulasi</h2>
            <p className="panel-intro">
              Pendapatan diakui setelah konsultasi Completed. Sesi Pending,
              Confirmed, Ongoing, atau Cancelled tidak masuk perhitungan.
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
                  ["Total konsultasi", sessions.length],
                  [
                    "Permintaan baru",
                    sessions.filter((c) => c.status === "Pending").length,
                  ],
                  [
                    "Konsultasi aktif",
                    sessions.filter((c) =>
                      ["Confirmed", "Ongoing"].includes(c.status),
                    ).length,
                  ],
                  ["Konsultasi selesai", income.completed.length],
                ]}
              />
              <div className="dashboard-welcome">
                <div>
                  <h2>{rupiah(income.lawyer)}</h2>
                  <p>Penghasilan simulasi Anda · 80% dari sesi selesai.</p>
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

function LawyerProfile({ profile }: { profile: ManagedLawyer }) {
  const { updateLawyer } = useCoins();
  const [form, setForm] = useState(profile),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await updateLawyer(profile.id, form);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function photo(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 250000
    ) {
      setError("Gunakan foto PNG/JPEG/WebP maksimal 250 KB.");

      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("Foto tidak dapat dibaca.");
    reader.onload = () => {
      setForm((f) => ({
        ...f,
        avatarUrl: String(reader.result),
      }));
      setError("");
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="dashboard-panel">
      <h2>Profil pengacara</h2>
      <p className="panel-intro">
        Profil yang aktif dan terverifikasi akan tampil di direktori publik.
      </p>
      <form onSubmit={save} className="auth-form ops-form">
        <label>
          Nama lengkap
          <input
            required
            maxLength={100}
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        </label>
        <label>
          Foto profil (maks. 250 KB)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => photo(e.target.files?.[0])}
          />
        </label>
        {form.avatarUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */ <img
            className="profile-preview"
            src={form.avatarUrl}
            alt="Pratinjau foto profil"
          />
        )}
        <label>
          Deskripsi
          <textarea
            rows={5}
            required
            maxLength={2000}
            value={form.bio}
            onChange={(e) =>
              setForm({
                ...form,
                bio: e.target.value,
              })
            }
          />
        </label>
        <label>
          Spesialisasi
          <select
            value={form.specialty}
            onChange={(e) =>
              setForm({
                ...form,
                specialty: e.target.value as ManagedLawyer["specialty"],
              })
            }
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="form-columns">
          <label>
            Pengalaman (tahun)
            <input
              type="number"
              required
              min={0}
              max={60}
              step={1}
              value={form.experience}
              onChange={(e) =>
                setForm({
                  ...form,
                  experience: Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            Tarif (Coins / 30 menit)
            <input
              type="number"
              required
              min={1}
              max={10000}
              step={1}
              value={form.rate}
              onChange={(e) =>
                setForm({
                  ...form,
                  rate: Number(e.target.value),
                })
              }
            />
          </label>
        </div>
        <label>
          Status ketersediaan
          <select
            value={form.online ? "online" : "offline"}
            onChange={(e) =>
              setForm({
                ...form,
                online: e.target.value === "online",
              })
            }
          >
            <option value="online">Tersedia</option>
            <option value="offline">Offline</option>
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button" disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan profil"}
        </button>
      </form>
    </section>
  );
}
