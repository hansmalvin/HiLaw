"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send, MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth, dashboardPath } from "@/components/auth/AuthProvider";
import { useCoins } from "@/store/CoinProvider";
import { mayReadConsultation, ownedLawyer } from "@/store/platform";
import { Modal } from "@/components/ui/Modal";
import { Status, localDate } from "./CustomerExperience";

export function ConsultationDetail({ id }: { id: string }) {
  const { user, ready: authReady } = useAuth();
  const { state, ready, error, sendMessage, transition } = useCoins();
  const router = useRouter();
  const [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [end, setEnd] = useState(false);
  const locked = useRef(false),
    request = useRef(""),
    bottom = useRef<HTMLDivElement>(null);
  const messages = state.platform.messages.filter(
    (m) => m.consultationId === id,
  );
  useEffect(() => {
    if (authReady && !user) router.replace("/sign-in");
  }, [authReady, user, router]);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages.length, id]);
  if (!authReady || !ready || !user)
    return (
      <div className="container section" role="status">
        Memuat konsultasi…
      </div>
    );
  const c = state.consultations.find((c) => c.id === id);
  if (error || !c || !mayReadConsultation(state, user, id))
    return (
      <div className="container section empty-state">
        <h1>Konsultasi tidak tersedia</h1>
        <p>{error || "Konsultasi tidak ditemukan pada akun Anda."}</p>
        <Link className="button outline" href={dashboardPath(user.role)}>
          Kembali ke dashboard
        </Link>
      </div>
    );
  const lawyer =
      user.role === "LAWYER" && ownedLawyer(state, user)?.id === c.lawyerId,
    participant = user.role === "CUSTOMER" || lawyer;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (locked.current || !input.trim()) return;
    locked.current = true;
    setBusy(true);
    setFailure("");
    if (!request.current) request.current = crypto.randomUUID();
    try {
      await sendMessage(id, input, request.current);
      setInput("");
      request.current = "";
    } catch (err) {
      setFailure((err as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function status(next: "Ongoing" | "Completed") {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setFailure("");
    try {
      await transition(id, next);
      setEnd(false);
    } catch (err) {
      setFailure((err as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="container section consultation-room">
      <Link
        className="text-link"
        href={
          user.role === "ADMIN"
            ? "/admin/consultations"
            : user.role === "LAWYER"
              ? "/lawyer/active"
              : "/customer/consultations"
        }
      >
        ← Kembali ke konsultasi
      </Link>
      <div className="room-grid">
        <section className="chat-panel">
          <header>
            <span className="assistant-avatar">
              <MessageCircle size={22} />
            </span>
            <div>
              <strong>
                {user.role === "CUSTOMER" ? c.lawyerName : c.customerName}
              </strong>
              <small>
                {c.specialty} · Chat {c.duration} menit
              </small>
            </div>
            <Status status={c.status} />
          </header>
          <div
            className="chat-messages room-messages"
            role="log"
            aria-label="Riwayat chat konsultasi"
            aria-live="polite"
          >
            {messages.length ? (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    "message " + (m.senderId === user.id ? "user" : "assistant")
                  }
                >
                  <div>
                    <strong className="message-author">{m.senderName}</strong>
                    <p>{m.text}</p>
                    <time dateTime={m.createdAt}>
                      {localDate(m.createdAt)} WIB
                    </time>
                  </div>
                </div>
              ))
            ) : (
              <div className="customer-empty">
                <MessageCircle size={30} />
                <h3>
                  {c.status === "Ongoing"
                    ? "Mulai percakapan Anda"
                    : "Belum ada pesan"}
                </h3>
                <p>
                  {c.status === "Pending"
                    ? "Menunggu pengacara menerima permintaan."
                    : c.status === "Confirmed"
                      ? "Pengacara dapat memulai sesi untuk mengaktifkan chat."
                      : "Percakapan Anda akan tersimpan pada browser ini."}
                </p>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="chat-bottom">
            {failure && (
              <p className="form-error" role="alert">
                {failure}
              </p>
            )}
            {c.status === "Ongoing" && participant ? (
              <form onSubmit={send}>
                <input
                  aria-label="Pesan konsultasi"
                  placeholder="Tulis pesan untuk peserta konsultasi…"
                  maxLength={2000}
                  value={input}
                  disabled={busy}
                  onChange={(e) => {
                    setInput(e.target.value);
                    request.current = "";
                  }}
                />
                <button
                  type="submit"
                  className="button"
                  disabled={busy || !input.trim()}
                  aria-label="Kirim pesan konsultasi"
                >
                  <Send size={19} />
                </button>
              </form>
            ) : (
              <p className="disclaimer">
                {user.role === "ADMIN"
                  ? "Tampilan monitoring Admin. Admin tidak dapat mengirim pesan."
                  : c.status === "Completed"
                    ? "Konsultasi selesai. Riwayat pesan dapat dibaca kembali."
                    : c.status === "Cancelled"
                      ? "Konsultasi dibatalkan. Coins sudah dikembalikan."
                      : "Chat aktif setelah sesi dimulai oleh pengacara."}
              </p>
            )}
            <p className="disclaimer">
              Simulasi frontend · Pesan disimpan secara lokal pada browser ini.
            </p>
          </div>
        </section>
        <aside className="dashboard-panel room-info">
          <h2>Informasi konsultasi</h2>
          <Status status={c.status} />
          <dl className="account-details">
            <div>
              <dt>Customer</dt>
              <dd>{c.customerName}</dd>
            </div>
            <div>
              <dt>Pengacara</dt>
              <dd>{c.lawyerName}</dd>
            </div>
            <div>
              <dt>Biaya</dt>
              <dd>{c.rate} Coins</dd>
            </div>
            <div>
              <dt>Tanggal WIB</dt>
              <dd>{localDate(c.createdAt)}</dd>
            </div>
          </dl>
          <h3>Kronologi singkat</h3>
          <p className="brief-text">{c.brief}</p>
          {c.status === "Confirmed" && lawyer && (
            <button
              className="button"
              disabled={busy}
              onClick={() => status("Ongoing")}
            >
              Mulai sesi
            </button>
          )}
          {c.status === "Ongoing" && participant && (
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setEnd(true)}
            >
              Akhiri konsultasi
            </button>
          )}
          {c.status === "Completed" && user.role === "CUSTOMER" && (
            <ReviewForm id={id} />
          )}
          <p className="payment-info">
            <ShieldCheck size={17} /> Gunakan data fiktif dalam demo. Percakapan
            dapat diakses peserta serta Admin pada browser yang sama.
          </p>
        </aside>
      </div>
      {end && (
        <Modal
          title="Akhiri konsultasi?"
          busy={busy}
          onClose={() => setEnd(false)}
        >
          <p>
            Sesi akan menjadi Completed dan chat beralih menjadi riwayat yang
            dapat dibaca. Pendapatan simulasi dibagi 20% untuk HiLaw dan 80%
            untuk pengacara.
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
              onClick={() => setEnd(false)}
            >
              Lanjutkan chat
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => status("Completed")}
            >
              {busy ? "Memproses…" : "Akhiri konsultasi"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReviewForm({ id }: { id: string }) {
  const { state, review } = useCoins();
  const [rating, setRating] = useState(5),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const existing = state.platform.reviews.find((r) => r.consultationId === id);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await review(id, rating, text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return existing ? (
    <div className="payment-info">
      <strong>Ulasan Anda · {existing.rating}/5</strong>
      <p>{existing.text}</p>
    </div>
  ) : (
    <form onSubmit={save} className="auth-form">
      <h3>Bagaimana konsultasi Anda?</h3>
      <label>
        Rating
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} bintang
            </option>
          ))}
        </select>
      </label>
      <label>
        Ulasan
        <textarea
          required
          minLength={5}
          maxLength={1000}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Menyimpan…" : "Kirim ulasan"}
      </button>
    </form>
  );
}
