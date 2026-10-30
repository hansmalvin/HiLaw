"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Coins } from "lucide-react";
import { useAuth, dashboardPath } from "@/components/auth/AuthProvider";
import { Modal } from "@/components/ui/Modal";
import { useCoins } from "@/store/CoinProvider";
import { rupiah } from "@/store/coinLedger";
import type { PublicLawyer } from "@/data/publicData";

export function ConsultationBooking({ lawyer }: { lawyer: PublicLawyer }) {
  const { user, ready: authReady } = useAuth(),
    { state, ready, error: storeError, book } = useCoins();
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [brief, setBrief] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  const request = useRef(""),
    locked = useRef(false);
  const balance = user ? (state.balances[user.id] ?? 0) : 0;
  const existing = user
    ? state.consultations.find(
        (c) =>
          c.customerId === user.id &&
          c.lawyerId === lawyer.id &&
          !["Completed", "Cancelled"].includes(c.status),
      )
    : null;

  function begin() {
    if (!user) {
      router.push(
        "/sign-in?next=" + encodeURIComponent("/lawyers/" + lawyer.id),
      );

      return;
    }
    if (user.role !== "CUSTOMER") {
      router.push(dashboardPath(user.role));

      return;
    }
    request.current = crypto.randomUUID();
    setOpen(true);
    setError("");
    setSuccess(false);
  }

  async function confirm() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await book(lawyer.id, brief, request.current);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="button"
        onClick={begin}
        disabled={!authReady || !ready || !lawyer.online}
      >
        {!lawyer.online ? "Belum tersedia" : "Konsultasi Sekarang"}
        <ArrowRight size={17} />
      </button>
      <small>
        {!lawyer.online
          ? "Pilih pengacara lain yang tersedia untuk konsultasi."
          : user?.role === "CUSTOMER"
            ? "Pembayaran menggunakan HiLaw Coins. Menunggu konfirmasi pengacara setelah pembayaran."
            : "Masuk sebagai Customer untuk memulai konsultasi."}
      </small>
      {open && (
        <Modal
          title={
            success ? "Permintaan konsultasi terkirim" : "Konfirmasi konsultasi"
          }
          busy={busy}
          onClose={() => setOpen(false)}
        >
          {success ? (
            <div className="booking-success">
              <CircleCheck size={45} />
              <h3>Pembayaran berhasil</h3>
              <p>
                Konsultasi bersama {lawyer.name} berstatus{" "}
                <strong>Pending</strong>. Pengacara akan mengonfirmasi
                permintaan Anda.
              </p>
              <p className="payment-info">
                Permintaan sudah masuk ke dashboard pengacara. Anda dapat
                mengikuti status di Konsultasi Saya.
              </p>
              <Link
                className="button"
                href="/customer/consultations"
                onClick={() => setOpen(false)}
              >
                Lihat Konsultasi Saya <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <h3>{lawyer.name}</h3>
              <p>{lawyer.specialty} · Chat 30 menit</p>
              <div className="booking-summary">
                <div>
                  <span>Tarif konsultasi</span>
                  <strong>{lawyer.rate} Coins</strong>
                </div>
                <div>
                  <span>Saldo saat ini</span>
                  <strong>{balance} Coins</strong>
                </div>
                <div>
                  <span>Setelah pembayaran</span>
                  <strong>{Math.max(0, balance - lawyer.rate)} Coins</strong>
                </div>
              </div>
              {storeError ? (
                <p className="form-error" role="alert">
                  {storeError}{" "}
                  <Link href="/customer/dashboard">Buka dashboard</Link>
                </p>
              ) : existing ? (
                <>
                  <p className="payment-info">
                    Anda sudah memiliki konsultasi {existing.status} dengan
                    pengacara ini. Tidak perlu membayar lagi.
                  </p>
                  <Link href="/customer/consultations" className="button">
                    Lihat Konsultasi Saya
                  </Link>
                </>
              ) : balance < lawyer.rate ? (
                <>
                  <p className="form-error" role="alert">
                    Saldo tidak mencukupi. Anda membutuhkan tambahan{" "}
                    {lawyer.rate - balance} Coins (
                    {rupiah(lawyer.rate - balance)}).
                  </p>
                  <Link className="button" href="/customer/top-up">
                    <Coins size={17} />
                    Top Up Coins
                  </Link>
                </>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void confirm();
                  }}
                >
                  <label className="brief-label">
                    Ceritakan masalah Anda
                    <textarea
                      required
                      minLength={10}
                      maxLength={1500}
                      rows={4}
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Tuliskan kronologi singkat dan tujuan konsultasi Anda."
                    />
                  </label>
                  <p className="demo-note">
                    10–1.500 karakter. Hindari data pribadi sensitif dalam demo.
                  </p>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <p className="payment-info">
                    Dengan mengonfirmasi, {lawyer.rate} Coins akan dipotong satu
                    kali dan permintaan konsultasi dibuat.
                  </p>
                  <div className="button-row modal-buttons">
                    <button
                      type="button"
                      className="button outline"
                      disabled={busy}
                      onClick={() => setOpen(false)}
                    >
                      Batal
                    </button>
                    <button
                      className="button"
                      type="submit"
                      disabled={busy || brief.trim().length < 10}
                    >
                      {busy ? "Memproses…" : "Bayar " + lawyer.rate + " Coins"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
