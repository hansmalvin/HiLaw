import type { PublicCategory, PublicLawyer } from "@/data/publicData";
import type { ApiLawyer } from "@/lib/api";

export interface ManagedLawyer extends PublicLawyer {
  userId: string;
  verification: "Unsubmitted" | "Pending" | "Verified" | "Rejected";
  licenseNumber?: string;
  organization?: string;
}

export const advocateOrganizations = [
  "PERADI",
  "KAI",
  "AAI",
  "IKADIN",
  "IPHI",
  "HAPI",
  "Lainnya",
] as const;

const statuses = {
  not_submitted: "Unsubmitted",
  pending: "Pending",
  approved: "Verified",
  rejected: "Rejected",
} as const;

export function toManaged(
  lawyer: ApiLawyer & { rating?: number; review_count?: number },
  name: string,
  avatar?: string | null,
): ManagedLawyer {
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
    rating: lawyer.rating ?? 0,
    reviews: lawyer.review_count ?? 0,
    rate: lawyer.rate_points ?? 50,
    online: lawyer.is_online ?? true,
  };
}
