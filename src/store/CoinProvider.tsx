"use client";
import { Toast } from "@/components/ui/Toast";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  api,
  type ApiConsultation,
  type ApiLawyer,
  type ApiProfile,
  type ApiTransaction,
} from "@/lib/api";
import { toManaged, type ManagedLawyer } from "./platform";
import {
  toConsultation,
  toTransaction,
  type CoinTransaction,
  type ConsultationStatus,
  type CustomerConsultation,
  type PaymentMethod,
} from "./coinLedger";

type PublicRecord = ApiLawyer & {
  rating: number;
  review_count: number;
  profiles: { full_name: string; avatar_url: string | null };
};
interface Wallet {
  balance: number;
  transactions: ApiTransaction[];
}
interface Data {
  owner: string;
  lawyers: ManagedLawyer[];
  balance: number;
  transactions: CoinTransaction[];
  consultations: CustomerConsultation[];
}

interface CoinContextValue {
  balance: number;
  transactions: CoinTransaction[];
  consultations: CustomerConsultation[];
  lawyers: ManagedLawyer[];
  ready: boolean;
  error: string;
  refresh: () => Promise<void>;
  topUp: (
    coins: number,
    method: PaymentMethod,
    requestId: string,
  ) => Promise<void>;
  book: (
    lawyerId: string,
    brief: string,
    requestId: string,
    minutes: number,
  ) => Promise<string>;
  transition: (id: string, status: ConsultationStatus) => Promise<void>;
}

const CoinContext = createContext<CoinContextValue | null>(null);
const empty = { lawyers: [], balance: 0, transactions: [], consultations: [] };

export function CoinProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);
  const owner = user?.id ?? "guest";

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    const [records, own, wallet, consultations] = await Promise.all([
      api<PublicRecord[]>("/lawyers", {}, false),
      user?.role === "LAWYER" ? api<ApiProfile>("/profile/me") : null,
      user && user.role !== "ADMIN" ? api<Wallet>("/wallet") : null,
      user ? api<ApiConsultation[]>("/consultations") : null,
    ]);
    const lawyers = records.map((l) =>
      toManaged(l, l.profiles.full_name, l.profiles.avatar_url),
    );
    // A lawyer always sees their own record, even before approval.
    if (own?.lawyer_profile) {
      const mine = toManaged(own.lawyer_profile, own.full_name, own.avatar_url);
      const index = lawyers.findIndex((l) => l.id === mine.id);
      if (index >= 0) lawyers[index] = mine;
      else lawyers.push(mine);
    }
    if (request !== generation.current) return;
    setData({
      owner: user?.id ?? "guest",
      lawyers,
      balance: wallet?.balance ?? 0,
      transactions: (wallet?.transactions ?? []).map(toTransaction),
      consultations: (consultations ?? []).map(toConsultation),
    });
    setError("");
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    const load = () => {
      void refresh().catch((e) => {
        if (active) setError((e as Error).message);
      });
    };
    load();
    // shortcut: 15s polling keeps lawyer queues and balances fresh; switch to Supabase Realtime when traffic grows.
    const timer = setInterval(() => {
      if (user && document.visibilityState === "visible") load();
    }, 15000);
    window.addEventListener("hilaw-profile-changed", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("hilaw-profile-changed", load);
    };
  }, [authReady, refresh, user]);

  async function topUp(coins: number, method: PaymentMethod, requestId: string) {
    await api("/wallet/topup", {
      method: "POST",
      body: JSON.stringify({ amount: coins, method, request_id: requestId }),
    });
    await refresh();
    setNotice("Top up berhasil. Saldo Poin HiLaw sudah diperbarui.");
  }

  async function book(
    lawyerId: string,
    brief: string,
    requestId: string,
    minutes: number,
  ) {
    const { id } = await api<{ id: string }>("/consultations", {
      method: "POST",
      body: JSON.stringify({
        lawyer_id: lawyerId,
        brief,
        request_id: requestId,
        duration_minutes: minutes,
      }),
    });
    await refresh();
    setNotice("Pembayaran berhasil. Konsultasi menunggu konfirmasi pengacara.");
    return id;
  }

  async function transition(id: string, status: ConsultationStatus) {
    await api("/consultations/" + id + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refresh();
    setNotice(
      status === "Cancelled"
        ? "Konsultasi dibatalkan. Poin sudah dikembalikan ke Customer."
        : "Status konsultasi diperbarui: " + status + ".",
    );
  }

  // Never show records loaded for a previous signed-in identity.
  const current = data?.owner === owner ? data : null;

  return (
    <CoinContext.Provider
      value={{
        ...(current ?? empty),
        ready: !!current,
        error,
        refresh,
        topUp,
        book,
        transition,
      }}
    >
      {error && (
        <p className="form-error container" role="alert">
          {error}{" "}
          <button
            onClick={() => {
              void refresh().catch((e) => setError((e as Error).message));
            }}
          >
            Coba lagi
          </button>
        </p>
      )}
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
  return useCoins().lawyers.filter((l) => l.verification === "Verified");
}
