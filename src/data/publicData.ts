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
  photo: string;
  bio: string;
  avatarUrl?: string;
}

export const publicLawyers: PublicLawyer[] = [
  {
    id: "nadira",
    name: "Nadira Putri, S.H., M.H.",
    specialty: "Hukum Keluarga",
    experience: 9,
    rating: 4.9,
    reviews: 128,
    rate: 50,
    online: true,
    photo: "47",
    bio: "Mendampingi persoalan keluarga dengan pendekatan empatik dan terstruktur. Berfokus pada konsultasi perceraian, hak asuh, dan kesepakatan keluarga.",
  },
  {
    id: "aditya",
    name: "Aditya Pratama, S.H.",
    specialty: "Hukum Bisnis",
    experience: 8,
    rating: 4.8,
    reviews: 96,
    rate: 75,
    online: true,
    photo: "12",
    bio: "Membantu pelaku usaha memahami kontrak, hubungan kemitraan, dan penyelesaian perselisihan bisnis dengan bahasa yang mudah dipahami.",
  },
  {
    id: "laras",
    name: "Laras Wulandari, S.H., M.H.",
    specialty: "Hukum Perdata",
    experience: 12,
    rating: 4.9,
    reviews: 164,
    rate: 100,
    online: false,
    photo: "44",
    bio: "Mendampingi sengketa perdata dan kewajiban pembayaran. Mengutamakan pemetaan masalah serta pilihan penyelesaian yang praktis.",
  },
  {
    id: "bima",
    name: "Bima Mahendra, S.H.",
    specialty: "Hukum Pidana",
    experience: 7,
    rating: 4.7,
    reviews: 82,
    rate: 60,
    online: true,
    photo: "33",
    bio: "Memberikan panduan awal mengenai proses pidana, hak para pihak, dan persiapan dokumen konsultasi.",
  },
  {
    id: "sinta",
    name: "Sinta Maharani, S.H.",
    specialty: "Hukum Ketenagakerjaan",
    experience: 6,
    rating: 4.8,
    reviews: 71,
    rate: 50,
    online: true,
    photo: "49",
    bio: "Mendampingi pertanyaan terkait kontrak kerja, hak pekerja, dan perselisihan hubungan kerja.",
  },
  {
    id: "farhan",
    name: "Farhan Wijaya, S.H., M.H.",
    specialty: "Hukum Properti",
    experience: 11,
    rating: 4.9,
    reviews: 113,
    rate: 90,
    online: false,
    photo: "52",
    bio: "Berfokus pada penelaahan dokumen properti, transaksi tanah, dan pemetaan sengketa kepemilikan.",
  },
  {
    id: "maya",
    name: "Maya Kusuma, S.H.",
    specialty: "Hukum Waris",
    experience: 10,
    rating: 4.8,
    reviews: 89,
    rate: 70,
    online: true,
    photo: "48",
    bio: "Membantu keluarga memahami persoalan pewarisan serta menyiapkan dokumen untuk konsultasi lanjutan.",
  },
  {
    id: "reza",
    name: "Reza Saputra, S.H.",
    specialty: "Konsultasi Umum",
    experience: 5,
    rating: 4.6,
    reviews: 54,
    rate: 35,
    online: true,
    photo: "60",
    bio: "Membantu memetakan persoalan hukum sehari-hari dan menentukan bidang pendampingan yang sesuai.",
  },
];
