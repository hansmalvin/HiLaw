"use client";
import { Toast } from "@/components/ui/Toast";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  normalizePlatform,
  syncUsers,
  transitionConsultation,
  appendMessage,
  saveLawyer,
  addReview,
  type ManagedLawyer,
  type PlatformStore,
  type PlatformData,
} from "./platform";
import type { DemoUser } from "@/components/auth/AuthProvider";
import type { ConsultationStatus } from "./coinLedger";
import {
  applyConsultation,
  applyTopUp,
  initialCoinStore,
  isCoinStore,
  type CoinStore,
  type PaymentMethod,
} from "./coinLedger";

const KEY = "hilaw-coins-v1";

interface CoinContextValue {
  state: PlatformStore;
  ready: boolean;
  error: string;
  notice: string;
  topUp: (
    coins: number,
    method: PaymentMethod,
    requestId: string,
  ) => Promise<void>;
  book: (lawyerId: string, brief: string, requestId: string) => Promise<string>;
  transition: (id: string, status: ConsultationStatus) => Promise<void>;
  sendMessage: (id: string, text: string, requestId: string) => Promise<void>;
  updateLawyer: (id: string, patch: Partial<ManagedLawyer>) => Promise<void>;
  review: (id: string, rating: number, text: string) => Promise<void>;
  saveSettings: (contact: string, name: string) => Promise<void>;
  reset: () => Promise<void>;
  dismiss: () => void;
}

const CoinContext = createContext<CoinContextValue | null>(null);

function readStore(): PlatformStore {
  const raw = localStorage.getItem(KEY);
  if (!raw) return normalizePlatform(initialCoinStore());
  const parsed: unknown = JSON.parse(raw);
  if (!isCoinStore(parsed))
    throw new Error(
      "Data Coins tidak valid. Gunakan Reset Demo Data untuk memulai kembali.",
    );

  return normalizePlatform(parsed);
}

export function CoinProvider({
  children,
  platformOverride,
}: {
  children: ReactNode;
  platformOverride?: Pick<PlatformData, "users" | "lawyers">;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<PlatformStore>(() =>
    normalizePlatform(initialCoinStore()),
  );
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  useEffect(() => {
    function restore() {
      try {
        setState(readStore());
        setError("");
      } catch {
        setError(
          "Data Coins tidak dapat dibaca. Aktifkan penyimpanan browser atau gunakan Reset Demo Data.",
        );
      }
      setReady(true);
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) restore();
    };
    restore();
    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function withPlatform(current: PlatformStore): PlatformStore {
    return platformOverride
      ? { ...current, platform: { ...current.platform, ...platformOverride } }
      : current;
  }

  async function commit(
    update: (current: PlatformStore) => CoinStore,
    reset = false,
  ) {
    if (!ready || inFlight.current)
      throw new Error("Transaksi sedang diproses. Tunggu sebentar.");
    inFlight.current = true;
    const run = async () => {
      const original = reset
        ? normalizePlatform(initialCoinStore())
        : readStore();
      const next = normalizePlatform(update(withPlatform(original)));
      // Persist the complete ledger before exposing the new balance to the UI.
      localStorage.setItem(
        KEY,
        JSON.stringify(
          platformOverride ? { ...next, platform: original.platform } : next,
        ),
      );
      setState(next);
      setError("");
    };
    try {
      if (navigator.locks) await navigator.locks.request(KEY, run);
      else await run();
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? err.message
          : "Penyimpanan gagal. Transaksi belum diproses.",
      );
    } finally {
      inFlight.current = false;
    }
  }

  function actor() {
    if (!user) throw new Error("Silakan masuk terlebih dahulu.");

    return user;
  }

  async function transition(id: string, status: ConsultationStatus) {
    const account = actor();
    await commit((s) =>
      transitionConsultation(s, account, id, status, new Date().toISOString()),
    );
    setNotice(
      status === "Cancelled"
        ? "Permintaan ditolak. Coins sudah dikembalikan ke Customer."
        : "Status konsultasi diperbarui: " + status + ".",
    );
  }

  async function sendMessage(id: string, text: string, requestId: string) {
    const account = actor();
    await commit((s) =>
      appendMessage(s, account, {
        id: requestId,
        consultationId: id,
        text,
        now: new Date().toISOString(),
      }),
    );
  }

  async function updateLawyer(id: string, patch: Partial<ManagedLawyer>) {
    const account = actor();
    await commit((s) => saveLawyer(s, account, id, patch));
    setNotice("Profil pengacara diperbarui.");
  }

  async function review(id: string, rating: number, text: string) {
    const account = actor();
    await commit((s) => addReview(s, account, id, rating, text));
    setNotice("Terima kasih. Ulasan Anda telah tersimpan.");
  }

  async function saveSettings(contact: string, name: string) {
    if (actor().role !== "ADMIN")
      throw new Error("Hanya Admin yang dapat mengubah pengaturan.");
    if (
      !/^[^ @]+@[^ @]+[.][^ @]+$/.test(contact) ||
      !name.trim() ||
      name.length > 50
    )
      throw new Error("Nama platform dan email kontak tidak valid.");
    await commit((s) => ({
      ...s,
      platform: {
        ...s.platform,
        settings: {
          contact,
          platformName: name.trim(),
        },
      },
    }));
    setNotice("Pengaturan platform disimpan.");
  }

  function customer() {
    if (!user || user.role !== "CUSTOMER")
      throw new Error("Masuk sebagai Customer untuk melanjutkan.");

    return user;
  }

  async function topUp(
    coins: number,
    method: PaymentMethod,
    requestId: string,
  ) {
    const account = customer();
    await commit((s) =>
      applyTopUp(s, {
        userId: account.id,
        coins,
        method,
        requestId,
        id: crypto.randomUUID(),
        now: new Date().toISOString(),
      }),
    );
    setNotice("Top up berhasil. Saldo HiLaw Coins sudah diperbarui.");
  }

  async function book(lawyerId: string, brief: string, requestId: string) {
    const account = customer();

    let id = "";
    await commit((s) => {
      const lawyer = s.platform.lawyers.find((l) => l.id === lawyerId);
      if (!lawyer || !lawyer.active || lawyer.verification !== "Verified")
        throw new Error("Pengacara belum aktif dan terverifikasi.");
      const next = applyConsultation(s, {
        userId: account.id,
        name: account.name,
        lawyer,
        brief,
        requestId,
        id: crypto.randomUUID(),
        now: new Date().toISOString(),
      });
      id =
        next.transactions.find(
          (t) => t.userId === account.id && t.requestId === requestId,
        )?.consultationId || "";

      return next;
    });
    setNotice("Pembayaran berhasil. Konsultasi menunggu konfirmasi pengacara.");

    return id;
  }

  async function reset() {
    const users = state.platform.users;
    await commit(
      () => syncUsers(normalizePlatform(initialCoinStore()), users),
      true,
    );
    setNotice("Data operasional demo telah direset untuk semua akun.");
  }

  return (
    <CoinContext.Provider
      value={{
        state: withPlatform(state),
        ready,
        error,
        notice,
        topUp,
        book,
        transition,
        sendMessage,
        updateLawyer,
        review,
        saveSettings,
        reset,
        dismiss: () => setNotice(""),
      }}
    >
      {children}
      <Toast message={notice} onClose={() => setNotice("")} />
    </CoinContext.Provider>
  );
}

export function useCoins() {
  const context = useContext(CoinContext);
  if (!context) throw new Error("CoinProvider diperlukan.");

  return context;
}

export function usePublicLawyers() {
  const { state } = useCoins();

  return state.platform.lawyers
    .filter((l) => l.active && l.verification === "Verified")
    .map((l) => {
      const added = state.platform.reviews.filter((r) => r.lawyerId === l.id);
      const count = l.reviews + added.length;

      return {
        ...l,
        reviews: count,
        rating: count
          ? Math.round(
              ((l.rating * l.reviews +
                added.reduce((sum, r) => sum + r.rating, 0)) /
                count) *
                10,
            ) / 10
          : 0,
      };
    });
}
