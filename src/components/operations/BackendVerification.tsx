"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  api,
  openDocument,
  reloadRemote,
  type ApiLawyer,
  type Verification,
} from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { categories } from "@/data/publicData";
import { advocateOrganizations } from "@/store/platform";
import { Modal } from "@/components/ui/Modal";
import { localDate } from "@/components/customer/CustomerExperience";

export function DocumentButton({
  id,
  admin = false,
}: {
  id: string;
  admin?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  async function load() {
    setBusy(true);
    setError("");
    try {
      setUrl(await openDocument(id, admin));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {url ? (
        <a
          className="button outline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buka gambar / PDF KTA
        </a>
      ) : (
        <button
          className="button outline"
          type="button"
          disabled={busy}
          onClick={load}
        >
          {busy ? "Memuat dokumen..." : "Muat dokumen KTA"}
        </button>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
interface OwnData {
  lawyer: ApiLawyer;
  history: Verification[];
}
export function BackendVerification() {
  const { user } = useAuth();
  const [data, setData] = useState<OwnData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: user?.name ?? "",
    kta_number: "",
    organization: "",
    specialization: "",
    experience_years: 0,
  });
  const load = useCallback(() => api<OwnData>("/lawyer/verification"), []);
  useEffect(() => {
    void load()
      .then(setData)
      .catch((e) => setError(e.message));
  }, [load]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (!file) throw new Error("Pilih KTA demonstrasi.");
      if (
        !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ||
        file.size > 2 * 1024 * 1024
      )
        throw new Error("Gunakan JPG, PNG, atau PDF maksimal 2 MB.");
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        body.append(key, String(value)),
      );
      body.append("kta_file", file);
      await api("/lawyer/verification", {
        method:
          data?.lawyer.verification_status === "not_submitted" ? "POST" : "PUT",
        body,
      });
      setData(await load());
      reloadRemote();
      setOpen(false);
      setSuccess("Pengajuan dikirim. Menunggu pemeriksaan admin.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const status = data?.lawyer.verification_status;
  const latest = data?.history[0];
  return (
    <section className="dashboard-panel ops-panel">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <h2>Verifikasi pengacara</h2>
          <p className="panel-intro" role="status">
            {!data
              ? "Memuat pengajuan..."
              : status === "pending"
                ? "Pengajuan pending. Menunggu persetujuan admin."
                : status === "approved"
                  ? "Terverifikasi. Perubahan data harus diajukan kembali untuk persetujuan admin."
                  : status === "rejected"
                    ? "Pengajuan ditolak. Perbaiki data dan ajukan kembali."
                    : "Ajukan verifikasi agar dapat menerima konsultasi."}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 md:w-auto md:flex-row md:items-center">
          {data && status !== "pending" && (
            <button
              className="button shrink-0"
              onClick={() => {
                setForm({
                  full_name: latest?.full_name ?? user?.name ?? "",
                  kta_number: data.lawyer.kta_number ?? "",
                  organization: data.lawyer.organization ?? "",
                  specialization: data.lawyer.specialization ?? "",
                  experience_years: data.lawyer.experience_years,
                });
                setFile(null);
                setError("");
                setOpen(true);
              }}
            >
              {status === "rejected"
                ? "Perbaiki & Ajukan Ulang"
                : status === "approved"
                  ? "Edit & Ajukan Ulang"
                  : "Ajukan Verifikasi"}
            </button>
          )}
          {data && status !== "not_submitted" && (
            <button
              className={
                status === "rejected"
                  ? "text-link text-center"
                  : "button outline"
              }
              onClick={() => setDetailsOpen(true)}
            >
              Lihat data verifikasi
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          {!data && (
            <button
              onClick={() => {
                void load()
                  .then(setData)
                  .then(() => setError(""))
                  .catch((e) => setError(e.message));
              }}
            >
              Coba lagi
            </button>
          )}
        </p>
      )}
      {success && <p role="status">{success}</p>}
      {detailsOpen && data && (
        <Modal
          title="Data verifikasi pengacara"
          onClose={() => setDetailsOpen(false)}
        >
          {data && (
            <dl className="account-details">
              {[
                ["Nama lengkap", latest?.full_name ?? user?.name],
                ["Nomor KTA", data.lawyer.kta_number ?? "Belum diisi"],
                ["Organisasi", data.lawyer.organization ?? "Belum diisi"],
                ["Spesialisasi", data.lawyer.specialization ?? "Belum diisi"],
                ["Pengalaman", data.lawyer.experience_years + " tahun"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {latest?.kta_file_path && <DocumentButton id={latest.id} />}
          <button
            className="button outline modal-buttons"
            onClick={() => setDetailsOpen(false)}
          >
            Tutup
          </button>
        </Modal>
      )}
      {open && (
        <Modal
          title={
            status === "approved"
              ? "Edit & Ajukan Ulang Verifikasi"
              : "Ajukan Verifikasi"
          }
          busy={busy}
          onClose={() => setOpen(false)}
        >
          <form className="auth-form ops-form" onSubmit={submit}>
            <label>
              Nama lengkap
              <input
                required
                minLength={2}
                maxLength={100}
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </label>
            <label>
              Nomor KTA
              <input
                required
                maxLength={100}
                value={form.kta_number}
                onChange={(e) =>
                  setForm({ ...form, kta_number: e.target.value })
                }
              />
            </label>
            <label>
              Organisasi advokat
              <select
                required
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
              >
                <option value="">Pilih organisasi</option>
                {advocateOrganizations.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Spesialisasi hukum
              <select
                required
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
              >
                <option value="">Pilih spesialisasi</option>
                {categories.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Pengalaman kerja (tahun)
              <input
                required
                type="number"
                min={0}
                max={60}
                step={1}
                value={form.experience_years}
                onChange={(e) =>
                  setForm({ ...form, experience_years: e.target.valueAsNumber })
                }
              />
            </label>
            <label>
              Upload KTA demonstrasi
              <input
                required
                type="file"
                accept="image/jpeg,image/png,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {status === "approved" && (
              <p className="payment-info">
                Setelah dikirim, status kembali menjadi pending dan profil Anda
                disembunyikan dari direktori sampai Admin menyetujui ulang.
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button" disabled={busy}>
              {busy
                ? "Mengirim..."
                : status === "not_submitted"
                  ? "Kirim Pengajuan"
                  : "Kirim Pengajuan Ulang"}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
export function BackendAdminVerifications() {
  const [items, setItems] = useState<Verification[]>([]);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Verification | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const load = useCallback(() => {
    return api<{ items: Verification[]; total: number }>(
      "/admin/verifications?page=" + page + (filter ? "&status=" + filter : ""),
    );
  }, [filter, page]);
  const receive = useCallback(
    (result: { items: Verification[]; total: number }) => {
      setItems(result.items);
      setTotal(result.total);
    },
    [],
  );
  useEffect(() => {
    void load()
      .then(receive)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load, receive]);
  async function detail(id: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      setSelected(await api<Verification>("/admin/verifications/" + id));
      setReason("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function review(decision: "approve" | "reject") {
    if (!selected || busy) return;
    if (decision === "reject" && reason.trim().length < 5) {
      setError("Isi alasan penolakan minimal 5 karakter.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/admin/verifications/" + selected.id + "/" + decision, {
        method: "PATCH",
        ...(decision === "reject"
          ? { body: JSON.stringify({ rejection_reason: reason }) }
          : {}),
      });
      setSelected(null);
      setSuccess(
        "Pengajuan berhasil " +
          (decision === "approve" ? "disetujui." : "ditolak."),
      );
      receive(await load());
      reloadRemote();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="dashboard-panel">
      <h2>Verifikasi Pengacara</h2>
      <label className="status-filter">
        Status{" "}
        <select
          disabled={loading || busy}
          value={filter}
          onChange={(e) => {
            setLoading(true);
            setError("");
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      {success && <p role="status">{success}</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <button
            onClick={() => {
              void load()
                .then(receive)
                .then(() => setError(""))
                .catch((e) => setError(e.message));
            }}
          >
            Muat ulang
          </button>
        </p>
      )}
      {loading ? (
        <p className="loading" role="status">
          Memuat pengajuan...
        </p>
      ) : (
        <div className="table-scroll">
          <table className="coin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Spesialisasi</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.full_name}</td>
                  <td>{item.specialization}</td>
                  <td>
                    <span
                      className={`admin-table-status admin-table-status--${item.status}`}
                    >
                      {item.status === "approved"
                        ? "Disetujui"
                        : item.status === "rejected"
                          ? "Ditolak"
                          : "Menunggu"}
                    </span>
                  </td>
                  <td>{localDate(item.submitted_at)}</td>
                  <td>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => {
                        void detail(item.id);
                      }}
                    >
                      Tinjau pengajuan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p>Belum ada pengajuan.</p>}
        </div>
      )}
      <div className="button-row">
        <button
          disabled={page === 1 || loading}
          onClick={() => {
            setLoading(true);
            setError("");
            setPage(page - 1);
          }}
        >
          Sebelumnya
        </button>
        <span>Halaman {page}</span>
        <button
          disabled={page * 25 >= total || loading}
          onClick={() => {
            setLoading(true);
            setError("");
            setPage(page + 1);
          }}
        >
          Berikutnya
        </button>
      </div>
      {selected && (
        <Modal
          title="Tinjau pengajuan pengacara"
          busy={busy}
          onClose={() => setSelected(null)}
        >
          <dl className="account-details">
            {[
              ["Nama", selected.full_name],
              ["Nomor KTA", selected.kta_number],
              ["Organisasi", selected.organization],
              ["Spesialisasi", selected.specialization],
              ["Pengalaman", selected.experience_years + " tahun"],
              ["Status", selected.status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {selected.kta_file_path && <DocumentButton id={selected.id} admin />}
          {selected.rejection_reason && (
            <p>Alasan: {selected.rejection_reason}</p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {selected.status === "pending" && (
            <>
              <label className="auth-form">
                Alasan penolakan
                <textarea
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="button-row modal-buttons">
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => {
                    void review("approve");
                  }}
                >
                  Approve
                </button>
                <button
                  className="button outline"
                  disabled={busy}
                  onClick={() => {
                    void review("reject");
                  }}
                >
                  Reject
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
