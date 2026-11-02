"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Clock, MessageCircle, Send, ShieldCheck, Star } from "lucide-react";
import { useAuth, dashboardPath } from "@/components/auth/AuthProvider";
import { useCoins } from "@/store/CoinProvider";
import { api, type ApiConsultation, type ConsultationStatus } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Status, localDate } from "./CustomerExperience";

interface Detail extends ApiConsultation {
  review: { rating: number; body: string | null } | null;
}
interface Thread {
  status: ConsultationStatus;
  started_at: string | null;
  items: {
    id: string;
    sender_id: string | null;
    sender_name: string;
    body: string;
    created_at: string;
  }[];
}

export function ConsultationDetail({ id }: { id: string }) {
  const { user, ready: authReady } = useAuth();
  const { transition } = useCoins();
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null),
    [thread, setThread] = useState<Thread | null>(null),
    [loadError, setLoadError] = useState(""),
    [now, setNow] = useState(0),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [confirm, setConfirm] = useState<ConsultationStatus | null>(null),
    [reviewLater, setReviewLater] = useState(false);
  const locked = useRef(false),
    request = useRef(""),
    bottom = useRef<HTMLDivElement>(null);
  const status = thread?.status ?? detail?.status;

  useEffect(() => {
    if (authReady && !user)
      router.replace("/sign-in?next=" + encodeURIComponent("/consultations/" + id));
  }, [authReady, user, router, id]);

  // Re-read the details whenever polling sees the status change (e.g. the lawyer starts the session).
  useEffect(() => {
    if (!user) return;
    let active = true;
    api<Detail>("/consultations/" + id)
      .then((d) => active && setDetail(d))
      .catch((e) => active && setLoadError((e as Error).message));
    return () => {
      active = false;
    };
  }, [id, user, thread?.status]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      api<Thread>("/consultations/" + id + "/messages")
        .then((t) => {
          if (!active) return;
          setThread(t);
          setNow(Date.now());
        })
        .catch(() => {});
    };
    tick();
    // shortcut: 3s polling is enough for two people chatting; move to Supabase Realtime for many concurrent rooms.
    const timer = setInterval(tick, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, user]);

  // A one-second clock for the countdown while the session runs; polling ends it on the server.
  useEffect(() => {
    if (status !== "Ongoing") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [thread?.items.length]);

  if (!authReady || !user || (!detail && !loadError))
    return (
      <div className="container section" role="status">
        Memuat konsultasi…
      </div>
    );
  if (!detail)
    return (
      <div className="container section empty-state">
        <h1>Konsultasi tidak tersedia</h1>
        <p>{loadError}</p>
        <Link className="button outline" href={dashboardPath(user.role)}>
          Kembali ke dashboard
        </Link>
      </div>
    );
  const c = detail,
    current = status ?? c.status,
    lawyer = c.lawyer_user_id === user.id,
    customer = c.customer_id === user.id,
    participant = lawyer || customer,
    startedAt = thread?.started_at ?? c.started_at,
    remaining =
      current === "Ongoing" && startedAt && now
        ? Math.max(
            0,
            Math.ceil(
              (Date.parse(startedAt) + c.duration_minutes * 60000 - now) / 1000,
            ),
          )
        : null,
    endedByTimer =
      current === "Completed" &&
      !!c.started_at &&
      !!c.ended_at &&
      Date.parse(c.ended_at) - Date.parse(c.started_at) >=
        c.duration_minutes * 60000,
    askReview =
      customer && current === "Completed" && !c.review && !reviewLater;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (locked.current || !input.trim()) return;
    locked.current = true;
    setBusy(true);
    setFailure("");
    // Reusing the id on retry lets the server ignore a duplicate send.
    if (!request.current) request.current = crypto.randomUUID();
    try {
      setThread(
        await api<Thread>("/consultations/" + id + "/messages", {
          method: "POST",
          body: JSON.stringify({ id: request.current, body: input }),
        }),
      );
      setInput("");
      request.current = "";
    } catch (err) {
      setFailure((err as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function changeStatus(next: ConsultationStatus) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setFailure("");
    try {
      await transition(id, next);
      setThread(await api<Thread>("/consultations/" + id + "/messages"));
      setConfirm(null);
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
            : lawyer
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
              <strong>{lawyer ? c.customer_name : c.lawyer_name}</strong>
              <small>
                {c.specialization} · Chat {c.duration_minutes} menit
              </small>
            </div>
            {remaining !== null && (
              <span
                className={"session-timer" + (remaining <= 300 ? " ending" : "")}
                role="timer"
                aria-label="Sisa waktu sesi"
              >
                <Clock size={14} />
                {remaining > 0
                  ? Math.floor(remaining / 60) +
                    ":" +
                    String(remaining % 60).padStart(2, "0")
                  : "Mengakhiri sesi…"}
              </span>
            )}
            <Status status={current} />
          </header>
          <div
            className="chat-messages room-messages"
            role="log"
            aria-label="Riwayat chat konsultasi"
            aria-live="polite"
          >
            {thread?.items.length ? (
              thread.items.map((m) => (
                <div
                  key={m.id}
                  className={
                    "message " + (m.sender_id === user.id ? "user" : "assistant")
                  }
                >
                  <div>
                    <strong className="message-author">{m.sender_name}</strong>
                    <p>{m.body}</p>
                    <time dateTime={m.created_at}>
                      {localDate(m.created_at)} WIB
                    </time>
                  </div>
                </div>
              ))
            ) : (
              <div className="customer-empty">
                <MessageCircle size={30} />
                <h3>
                  {current === "Ongoing"
                    ? "Mulai percakapan Anda"
                    : "Belum ada pesan"}
                </h3>
                <p>
                  {current === "Pending"
                    ? "Menunggu pengacara menerima permintaan."
                    : current === "Confirmed"
                      ? "Pengacara dapat memulai sesi untuk membuka chat."
                      : current === "Ongoing"
                        ? "Pesan baru muncul otomatis untuk kedua peserta."
                        : "Tidak ada pesan pada konsultasi ini."}
                </p>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="chat-bottom">
            {failure && !confirm && (
              <p className="form-error" role="alert">
                {failure}
              </p>
            )}
            {current === "Ongoing" && participant ? (
              <form onSubmit={send}>
                <input
                  aria-label="Pesan konsultasi"
                  placeholder={
                    "Tulis pesan untuk " +
                    (lawyer ? c.customer_name : c.lawyer_name) +
                    "…"
                  }
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
                {!participant
                  ? "Tampilan monitoring Admin. Admin tidak dapat mengirim pesan."
                  : current === "Completed"
                    ? endedByTimer
                      ? "Waktu " +
                        c.duration_minutes +
                        " menit habis, sesi berakhir otomatis. Riwayat pesan tetap dapat dibaca."
                      : "Konsultasi selesai. Riwayat pesan dapat dibaca kembali."
                    : current === "Cancelled"
                      ? "Konsultasi dibatalkan. Poin sudah dikembalikan."
                      : "Chat aktif setelah sesi dimulai oleh pengacara."}
              </p>
            )}
          </div>
        </section>
        <aside className="dashboard-panel room-info">
          <h2>Informasi konsultasi</h2>
          <Status status={current} />
          <dl className="account-details">
            <div>
              <dt>Customer</dt>
              <dd>{c.customer_name}</dd>
            </div>
            <div>
              <dt>Pengacara</dt>
              <dd>{c.lawyer_name}</dd>
            </div>
            <div>
              <dt>Paket</dt>
              <dd>
                {c.duration_minutes} menit · {c.rate} Poin
              </dd>
            </div>
            <div>
              <dt>Tanggal WIB</dt>
              <dd>{localDate(c.created_at)}</dd>
            </div>
          </dl>
          <h3>Kronologi singkat</h3>
          <p className="brief-text">{c.brief}</p>
          {current === "Pending" && lawyer && (
            <button
              className="button"
              disabled={busy}
              onClick={() => changeStatus("Confirmed")}
            >
              Terima permintaan
            </button>
          )}
          {current === "Confirmed" && lawyer && (
            <button
              className="button"
              disabled={busy}
              onClick={() => changeStatus("Ongoing")}
            >
              Mulai sesi
            </button>
          )}
          {current === "Ongoing" && participant && (
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setConfirm("Completed")}
            >
              Akhiri konsultasi
            </button>
          )}
          {current === "Pending" && (participant || user.role === "ADMIN") && (
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setConfirm("Cancelled")}
            >
              {lawyer ? "Tolak & refund" : "Batalkan & refund"}
            </button>
          )}
          {current === "Completed" && customer && c.review && (
            <div className="payment-info">
              <strong>Ulasan Anda · {"★".repeat(c.review.rating)}</strong>
              {c.review.body && <p>{c.review.body}</p>}
            </div>
          )}
          {current === "Completed" && customer && !c.review && (
            <button className="button" onClick={() => setReviewLater(false)}>
              <Star size={16} /> Beri ulasan
            </button>
          )}
          <p className="payment-info">
            <ShieldCheck size={17} /> Percakapan hanya dapat dibaca kedua
            peserta dan Admin HiLaw.
          </p>
        </aside>
      </div>
      {askReview && !confirm && (
        <Modal
          title="Bagaimana konsultasi Anda?"
          onClose={() => setReviewLater(true)}
        >
          <p>
            {endedByTimer ? "Waktu sesi telah habis. " : "Sesi telah selesai. "}
            Beri rating untuk {c.lawyer_name}. Ulasan membantu customer lain
            memilih pengacara.
          </p>
          <ReviewForm
            id={id}
            onSaved={setDetail}
            onLater={() => setReviewLater(true)}
          />
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            confirm === "Completed" ? "Akhiri konsultasi?" : "Batalkan konsultasi?"
          }
          busy={busy}
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm === "Completed"
              ? "Sesi selesai lebih awal dan chat beralih menjadi riwayat. Sisa waktu tidak dikembalikan sebagai Poin. Pengacara menerima 80% biaya, 20% untuk HiLaw."
              : `${c.rate} Poin dikembalikan penuh ke saldo Customer.`}
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
              onClick={() => setConfirm(null)}
            >
              Kembali
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => changeStatus(confirm)}
            >
              {busy ? "Memproses…" : "Ya, lanjutkan"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const ratingLabels = [
  "Pilih 1–5 bintang",
  "Sangat kurang",
  "Kurang",
  "Cukup",
  "Baik",
  "Sangat baik",
];

function ReviewForm({
  id,
  onSaved,
  onLater,
}: {
  id: string;
  onSaved: (detail: Detail) => void;
  onLater: () => void;
}) {
  const [rating, setRating] = useState(0),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    setError("");
    try {
      onSaved(
        await api<Detail>("/consultations/" + id + "/review", {
          method: "POST",
          body: JSON.stringify({
            rating,
            ...(text.trim() ? { body: text } : {}),
          }),
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="auth-form review-form">
      <div
        className="star-rating"
        role="radiogroup"
        aria-label="Rating bintang"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={n + " bintang"}
            className={n <= rating ? "on" : ""}
            onClick={() => setRating(n)}
          >
            <Star size={32} fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <p className="rating-label" aria-live="polite">
        {ratingLabels[rating]}
      </p>
      <label>
        Deskripsi (opsional)
        <textarea
          maxLength={1000}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ceritakan pengalaman konsultasi Anda…"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row modal-buttons">
        <button
          type="button"
          className="button outline"
          disabled={busy}
          onClick={onLater}
        >
          Nanti saja
        </button>
        <button className="button" disabled={busy || !rating}>
          {busy ? "Menyimpan…" : "Kirim ulasan"}
        </button>
      </div>
    </form>
  );
}
