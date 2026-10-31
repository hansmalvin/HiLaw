"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { lawyerPreferences } from "@/lib/lawyerPreferences";
import { CoinProvider } from "./CoinProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, type ApiLawyer, type ApiProfile } from "@/lib/api";
import type { ManagedLawyer } from "./platform";
import type { PublicCategory } from "@/data/publicData";
type PublicRecord = ApiLawyer & {
  profiles: { full_name: string; avatar_url: string | null };
};
export function toManaged(
  lawyer: ApiLawyer,
  name: string,
  avatar?: string | null,
): ManagedLawyer {
  const statuses = {
    not_submitted: "Unsubmitted",
    pending: "Pending",
    approved: "Verified",
    rejected: "Rejected",
  } as const;
  return {
    id: lawyer.id,
    userId: lawyer.user_id,
    name,
    specialty: (lawyer.specialization ?? "Konsultasi Umum") as PublicCategory,
    experience: lawyer.experience_years,
    organization: lawyer.organization ?? "",
    licenseNumber: lawyer.kta_number ?? "",
    bio: lawyer.bio ?? "Lengkapi profil pengacara Anda.",
    verification: statuses[lawyer.verification_status],
    avatarUrl: avatar ?? undefined,
    photo: "",
    rating: 0,
    reviews: 0,
    active: true,
    ...lawyerPreferences(lawyer.id),
  };
}
export function AppCoinProvider({ children }: { children: ReactNode }) {
  return <BackendCoinProvider>{children}</BackendCoinProvider>;
}
function BackendCoinProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [lawyers, setLawyers] = useState<ManagedLawyer[]>([]);
  const [error, setError] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const generation = useRef(0);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  const load = useCallback(async () => {
    const request = ++generation.current;
    const records = await api<PublicRecord[]>("/lawyers", {}, false);
    const mapped = records.map((l) =>
      toManaged(l, l.profiles.full_name, l.profiles.avatar_url),
    );
    if (user?.role === "LAWYER") {
      const profile = await api<ApiProfile>("/profile/me");
      if (profile.lawyer_profile) {
        const own = toManaged(
          profile.lawyer_profile,
          profile.full_name,
          profile.avatar_url,
        );
        const index = mapped.findIndex((l) => l.id === own.id);
        if (index >= 0) mapped[index] = own;
        else mapped.push(own);
      }
    }
    if (request !== generation.current) return;
    setLawyers(mapped);
    setError("");
    setLoadedFor(user?.id ?? "guest");
  }, [user]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const refresh = () => {
      void load().catch((e) => {
        if (active) setError((e as Error).message);
      });
    };
    refresh();
    window.addEventListener("hilaw-profile-changed", refresh);
    return () => {
      active = false;
      invalidate();
      window.removeEventListener("hilaw-profile-changed", refresh);
    };
  }, [load, ready, invalidate]);
  // Do not show cached profile records belonging to a previous signed-in identity.
  return (
    <CoinProvider
      platformOverride={{
        lawyers: loadedFor === (user?.id ?? "guest") ? lawyers : [],
        users: user ? [user] : [],
      }}
    >
      {error && (
        <p className="form-error container" role="alert">
          {error}{" "}
          <button
            onClick={() => {
              void load().catch((e) => setError((e as Error).message));
            }}
          >
            Coba lagi
          </button>
        </p>
      )}
      {children}
    </CoinProvider>
  );
}
