"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, reloadRemote, saveSession, type ApiProfile } from "@/lib/api";
import {
  lawyerPreferences,
  saveLawyerPreferences,
} from "@/lib/lawyerPreferences";
import { useAuth } from "./AuthProvider";
import { Modal } from "@/components/ui/Modal";
export function BackendProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    bio: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [photoVersion, setPhotoVersion] = useState(0);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const [preferences, setPreferences] = useState({ rate: 50, online: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    void api<ApiProfile>("/profile/me")
      .then((p) => {
        setProfile(p);
        if (p.lawyer_profile)
          setPreferences(lawyerPreferences(p.lawyer_profile.id));
        setForm({
          full_name: p.full_name,
          phone: p.phone ?? "",
          avatar_url: p.avatar_url ?? "",
          bio: p.lawyer_profile?.bio ?? "",
        });
      })
      .catch((e) => setError(e.message));
  }, [user?.id]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      let p = await api<ApiProfile>("/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          ...(profile?.role !== "lawyer" ? { full_name: form.full_name } : {}),
          phone: form.phone,
          ...(profile?.role === "admin"
            ? { avatar_url: form.avatar_url || null }
            : {}),
          ...(profile?.role === "lawyer" ? { bio: form.bio } : {}),
        }),
      });
      if (photo && (p.role === "customer" || p.role === "lawyer")) {
        const body = new FormData();
        body.append("avatar", photo);
        try {
          p = await api<ApiProfile>("/profile/me/avatar", {
            method: "POST",
            body,
          });
        } catch (e) {
          setProfile(p);
          reloadRemote();
          throw new Error(
            "Data profil tersimpan, tetapi foto gagal diunggah: " +
              (e as Error).message,
          );
        }
        setPhoto(null);
        setPreview("");
        setPhotoVersion((value) => value + 1);
      }
      setForm((value) => ({ ...value, avatar_url: p.avatar_url ?? "" }));
      if (p.lawyer_profile)
        saveLawyerPreferences(
          p.lawyer_profile.id,
          preferences.rate,
          preferences.online,
        );
      setProfile(p);
      reloadRemote();
      setSuccess("Profil berhasil diperbarui.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/profile/me", {
        method: "DELETE",
        body: JSON.stringify({ confirmation, password }),
      });
      saveSession(null);
      reloadRemote();
      router.replace("/sign-in");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="dashboard-panel">
      <h2>Informasi akun</h2>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {success && <p role="status">{success}</p>}
      {!profile ? (
        <p role="status">Memuat profil...</p>
      ) : (
        <>
          <form className="auth-form ops-form" onSubmit={save}>
            <label>
              Nama lengkap
              <input
                required
                minLength={2}
                maxLength={100}
                readOnly={profile.role === "lawyer"}
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </label>
            <label>
              Email
              <input readOnly value={profile.email ?? ""} />
            </label>
            <label>
              Nomor telepon
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            {profile.role !== "admin" ? (
              <>
                <label>
                  Foto profil
                  <input
                    key={photoVersion}
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (
                        !["image/jpeg", "image/png"].includes(file.type) ||
                        file.size > 2 * 1024 * 1024
                      ) {
                        setError("Pilih foto JPG atau PNG maksimal 2 MB.");
                        setPhoto(null);
                        setPreview("");
                        e.target.value = "";
                        return;
                      }
                      setPhoto(file);
                      setPreview(URL.createObjectURL(file));
                      setError("");
                      setSuccess("");
                    }}
                  />
                </label>
              </>
            ) : (
              <label>
                URL foto profil (HTTPS)
                <input
                  type="url"
                  maxLength={2048}
                  value={form.avatar_url}
                  onChange={(e) =>
                    setForm({ ...form, avatar_url: e.target.value })
                  }
                />
              </label>
            )}
            {profile.role === "lawyer" && (
              <label>
                Deskripsi
                <textarea
                  maxLength={2000}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </label>
            )}
            {profile.role === "lawyer" && (
              <>
                <label>
                  Tarif (Coins / 30 menit)
                  <input
                    required
                    type="number"
                    min={1}
                    max={10000}
                    step={1}
                    value={preferences.rate}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        rate: e.target.valueAsNumber,
                      })
                    }
                  />
                </label>
                <label>
                  Ketersediaan
                  <select
                    value={preferences.online ? "online" : "offline"}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        online: e.target.value === "online",
                      })
                    }
                  >
                    <option value="online">Tersedia</option>
                    <option value="offline">Offline</option>
                  </select>
                </label>
              </>
            )}
            <button className="button" disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan profil"}
            </button>
          </form>
          <button
            className="button outline"
            onClick={() => {
              setDeleting(true);
              setError("");
              setConfirmation("");
              setPassword("");
            }}
          >
            Hapus akun
          </button>
        </>
      )}
      {deleting && (
        <Modal
          title="Hapus akun permanen?"
          busy={busy}
          onClose={() => setDeleting(false)}
        >
          <p>
            Akun, profil, dan riwayat verifikasi akan dihapus. Ketik DELETE dan
            masukkan password untuk mengonfirmasi.
          </p>
          <form className="auth-form" onSubmit={remove}>
            <label>
              Konfirmasi
              <input
                required
                value={confirmation}
                pattern="DELETE"
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button"
              disabled={busy || confirmation !== "DELETE"}
            >
              Hapus akun saya
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
