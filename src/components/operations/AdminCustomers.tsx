"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { localDate } from "@/components/customer/CustomerExperience";
interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}
interface CustomerList {
  items: Customer[];
  total: number;
}
export function AdminCustomers() {
  const [data, setData] = useState<CustomerList>({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const load = useCallback(
    () => api<CustomerList>(`/admin/customers?page=${page}&limit=25`),
    [page],
  );
  useEffect(() => {
    let active = true;
    void load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load]);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setData(await load());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function remove(e: FormEvent) {
    e.preventDefault();
    if (!selected || busy || confirmation !== "DELETE") return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/customers/${selected.id}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmation }),
      });
      setSelected(null);
      setConfirmation("");
      setNotice("Akun customer berhasil dihapus.");
      if (data.items.length === 1 && page > 1) {
        setLoading(true);
        setPage(page - 1);
      } else await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="dashboard-panel">
      <div className="customer-panel-title">
        <h2>Kelola Customer</h2>
        <button
          className="button outline"
          disabled={loading || busy}
          onClick={() => {
            void refresh();
          }}
        >
          Muat ulang
        </button>
      </div>
      <p className="panel-intro">
        Daftar akun customer dari database. Login terakhir menunjukkan waktu
        terakhir masuk, bukan status online saat ini.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Memuat customer...</p>
      ) : (
        <>
          <p>{data.total} akun customer</p>
          <div className="table-scroll">
            <table className="coin-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Telepon</th>
                  <th>Terdaftar (WIB)</th>
                  <th>Login terakhir (WIB)</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.full_name}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>{localDate(customer.created_at)}</td>
                    <td>
                      {customer.last_sign_in_at
                        ? localDate(customer.last_sign_in_at)
                        : "Belum pernah login"}
                    </td>
                    <td>
                      <button
                        className="text-link admin-table-delete"
                        disabled={busy}
                        onClick={() => {
                          setSelected(customer);
                          setConfirmation("");
                          setError("");
                        }}
                      >
                        Hapus akun
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.items.length && <p>Belum ada customer terdaftar.</p>}
          </div>
        </>
      )}
      <div className="button-row">
        <button
          disabled={page <= 1 || loading || busy}
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
          disabled={page * 25 >= data.total || loading || busy}
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
          title="Hapus akun customer?"
          busy={busy}
          onClose={() => setSelected(null)}
        >
          <p>
            Akun <strong>{selected.full_name}</strong> ({selected.email})
            beserta profilnya akan dihapus permanen. Customer tidak dapat login
            lagi dengan akun tersebut.
          </p>
          <form className="auth-form" onSubmit={remove}>
            <label>
              Ketik DELETE untuk konfirmasi
              <input
                required
                autoComplete="off"
                pattern="DELETE"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="button-row modal-buttons">
              <button
                className="button outline"
                type="button"
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                Batal
              </button>
              <button
                className="button"
                disabled={busy || confirmation !== "DELETE"}
              >
                {busy ? "Menghapus..." : "Hapus permanen"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      <Toast message={notice} onClose={() => setNotice("")} />
    </section>
  );
}
