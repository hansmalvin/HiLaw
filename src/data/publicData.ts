export const categories = [
  "Hukum Pidana",
  "Hukum Perdata",
  "Hukum Keluarga",
  "Hukum Bisnis",
  "Hukum Properti",
  "Hukum Ketenagakerjaan",
  "Hukum Waris",
  "Konsultasi Umum",
] as const;

export type PublicCategory = (typeof categories)[number];

export interface PublicLawyer {
  id: string;
  name: string;
  specialty: PublicCategory;
  experience: number;
  rating: number;
  reviews: number;
  rate: number;
  online: boolean;
  bio: string;
  avatarUrl?: string;
}
