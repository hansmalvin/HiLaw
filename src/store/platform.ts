import {
  publicLawyers,
  categories,
  type PublicLawyer,
} from "@/data/publicData";
import type { DemoUser } from "@/components/auth/AuthProvider";
import type { CoinStore, ConsultationStatus } from "./coinLedger";

export interface ManagedLawyer extends PublicLawyer {
  userId: string;
  verification: "Unsubmitted" | "Pending" | "Verified" | "Rejected";
  licenseNumber?: string;
  organization?: string;
  ktaFileName?: string;
  active: boolean;
  avatarUrl?: string;
}

export const advocateOrganizations = ["PERADI", "KAI", "AAI", "IKADIN", "IPHI", "HAPI", "Lainnya"] as const;

export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderName: string;
  role: "CUSTOMER" | "LAWYER";
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  consultationId: string;
  lawyerId: string;
  customerId: string;
  name: string;
  rating: number;
  text: string;
}

export interface PlatformData {
  users: DemoUser[];
  lawyers: ManagedLawyer[];
  messages: ChatMessage[];
  reviews: Review[];
  settings: {
    contact: string;
    platformName: string;
  };
}

export type PlatformStore = CoinStore & {
  platform: PlatformData;
};

export const demoLawyerUserId = (id: string) =>
  id === "nadira" ? "demo-lawyer" : "demo-lawyer-" + id;

export function initialPlatform(): PlatformData {
  return {
    users: [
      {
        id: "demo-customer",
        name: "Aulia Rahma",
        email: "customer@hilaw.demo",
        phone: "081234567890",
        role: "CUSTOMER",
      },
      {
        id: "demo-admin",
        name: "Admin HiLaw",
        email: "admin@hilaw.demo",
        phone: "081234567892",
        role: "ADMIN",
      },
      ...publicLawyers.map((l) => ({
        id: demoLawyerUserId(l.id),
        name: l.name,
        email: l.id === "nadira" ? "lawyer@hilaw.demo" : l.id + "@hilaw.demo",
        phone: "081234567891",
        role: "LAWYER" as const,
      })),
    ],
    lawyers: publicLawyers.map((l) => ({
      ...l,
      userId: demoLawyerUserId(l.id),
      verification: l.id === "farhan" ? "Pending" : "Verified",
      active: true,
      licenseNumber: "DEMO-KTA-" + l.id.toUpperCase(),
      organization: "PERADI",
      ktaFileName: "kta-demo-" + l.id + ".pdf",
    })),
    messages: [
      {
        id: "seed-message-1",
        consultationId: "seed-consultation",
        senderId: "demo-customer",
        senderName: "Aulia Rahma",
        role: "CUSTOMER",
        text: "Halo, saya ingin memahami dokumen apa yang perlu disiapkan untuk konsultasi keluarga.",
        createdAt: "2026-10-28T03:01:00.000Z",
      },
      {
        id: "seed-message-2",
        consultationId: "seed-consultation",
        senderId: "demo-lawyer",
        senderName: "Nadira Putri",
        role: "LAWYER",
        text: "Halo Aulia. Mari mulai dari kronologi singkat dan daftar dokumen yang sudah tersedia. Percakapan ini adalah contoh demonstrasi.",
        createdAt: "2026-10-28T03:02:00.000Z",
      },
    ],
    reviews: [],
    settings: {
      contact: "halo@hilaw.example",
      platformName: "HiLaw",
    },
  };
}

export function normalizePlatform(store: CoinStore): PlatformStore {
  const platform = store.platform ?? initialPlatform();
  if (
    !Array.isArray(platform.users) ||
    !Array.isArray(platform.lawyers) ||
    !Array.isArray(platform.messages) ||
    !Array.isArray(platform.reviews) ||
    !platform.settings ||
    typeof platform.settings.contact !== "string" ||
    typeof platform.settings.platformName !== "string" ||
    !platform.users.every(
      (u) =>
        u &&
        typeof u.id === "string" &&
        typeof u.name === "string" &&
        typeof u.email === "string" &&
        typeof u.phone === "string" &&
        ["CUSTOMER", "LAWYER", "ADMIN"].includes(u.role),
    ) ||
    !platform.lawyers.every(
      (l) =>
        l &&
        typeof l.id === "string" &&
        typeof l.userId === "string" &&
        typeof l.name === "string" &&
        typeof l.bio === "string" &&
        typeof l.photo === "string" &&
        categories.includes(l.specialty) &&
        Number.isSafeInteger(l.rate) &&
        l.rate > 0 &&
        Number.isSafeInteger(l.experience) &&
        l.experience >= 0 &&
        Number.isFinite(l.rating) &&
        Number.isFinite(l.reviews) &&
        typeof l.online === "boolean" &&
        typeof l.active === "boolean" &&
        ["Unsubmitted", "Pending", "Verified", "Rejected"].includes(l.verification),
    ) ||
    !platform.messages.every(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.consultationId === "string" &&
        typeof m.senderId === "string" &&
        typeof m.senderName === "string" &&
        ["CUSTOMER", "LAWYER"].includes(m.role) &&
        typeof m.text === "string" &&
        Number.isFinite(Date.parse(m.createdAt)),
    ) ||
    !platform.reviews.every(
      (r) =>
        r &&
        typeof r.id === "string" &&
        typeof r.consultationId === "string" &&
        typeof r.lawyerId === "string" &&
        typeof r.customerId === "string" &&
        typeof r.name === "string" &&
        Number.isInteger(r.rating) &&
        r.rating >= 1 &&
        r.rating <= 5 &&
        typeof r.text === "string",
    )
  )
    throw new Error("Data platform tidak valid. Gunakan Reset Demo Data.");

  return {
    ...store,
    platform: {
      ...platform,
      // Older registered accounts were marked Pending before submitting a form.
      lawyers: platform.lawyers.map((lawyer) =>
        lawyer.verification === "Pending" && !lawyer.ktaFileName && !lawyer.userId.startsWith("demo-lawyer")
          ? { ...lawyer, verification: "Unsubmitted" as const }
          : lawyer,
      ),
    },
  };
}

export function syncUsers(
  store: PlatformStore,
  users: DemoUser[],
): PlatformStore {
  let platform = {
    ...store.platform,
    users: [...store.platform.users],
    lawyers: [...store.platform.lawyers],
  };
  for (const user of users) {
    if (!platform.users.some((u) => u.id === user.id))
      platform.users.push(user);
    if (
      user.role === "LAWYER" &&
      !platform.lawyers.some((l) => l.userId === user.id)
    ) {
      platform.lawyers.push({
        id: "lawyer-" + user.id,
        userId: user.id,
        name: user.name,
        specialty: "Konsultasi Umum",
        experience: 0,
        rating: 0,
        reviews: 0,
        rate: 50,
        online: false,
        photo: "",
        bio: "Lengkapi profil Anda untuk mengajukan verifikasi.",
        verification: "Unsubmitted",
        active: true,
      });
    }
  }

  return {
    ...store,
    platform,
  };
}

export function ownedLawyer(store: PlatformStore, actor: DemoUser) {
  return store.platform.lawyers.find((l) => l.userId === actor.id);
}

export function mayReadConsultation(
  store: PlatformStore,
  actor: DemoUser,
  id: string,
) {
  const c = store.consultations.find((c) => c.id === id);

  return (
    !!c &&
    (actor.role === "ADMIN" ||
      (actor.role === "CUSTOMER" && c.customerId === actor.id) ||
      (actor.role === "LAWYER" &&
        store.platform.lawyers.some(
          (l) => l.id === c.lawyerId && l.userId === actor.id,
        )))
  );
}

export function transitionConsultation(
  store: PlatformStore,
  actor: DemoUser,
  id: string,
  next: ConsultationStatus,
  now: string,
): PlatformStore {
  const c = store.consultations.find((c) => c.id === id);
  if (!c || !mayReadConsultation(store, actor, id))
    throw new Error("Konsultasi tidak dapat diakses.");
  const owner =
    actor.role === "LAWYER" && ownedLawyer(store, actor)?.id === c.lawyerId;
  const participant = actor.role === "CUSTOMER" && actor.id === c.customerId;
  const valid =
    (next === "Confirmed" && c.status === "Pending" && owner) ||
    (next === "Ongoing" && c.status === "Confirmed" && owner) ||
    (next === "Completed" &&
      c.status === "Ongoing" &&
      (owner || participant)) ||
    (next === "Cancelled" &&
      c.status === "Pending" &&
      (owner || actor.role === "ADMIN"));
  if (!valid)
    throw new Error("Perubahan status tidak diizinkan atau sudah diproses.");
  if (owner && next !== "Cancelled") {
    const lawyer = ownedLawyer(store, actor);
    if (!lawyer?.active || lawyer.verification !== "Verified")
      throw new Error("Profil pengacara belum aktif dan terverifikasi.");
  }
  let result: PlatformStore = {
    ...store,
    consultations: store.consultations.map((item) =>
      item.id === id
        ? {
            ...item,
            status: next,
          }
        : item,
    ),
  };
  if (next === "Cancelled") {
    const balance = (store.balances[c.customerId] ?? 0) + c.rate;
    result = {
      ...result,
      balances: {
        ...store.balances,
        [c.customerId]: balance,
      },
      transactions: [
        {
          id: "refund-" + id,
          requestId: "refund-" + id,
          userId: c.customerId,
          type: "REFUND",
          coins: c.rate,
          balanceAfter: balance,
          status: "Success",
          createdAt: now,
          description: "Refund konsultasi bersama " + c.lawyerName,
          consultationId: id,
        },
        ...store.transactions,
      ],
    };
  }

  return result;
}

export function appendMessage(
  store: PlatformStore,
  actor: DemoUser,
  input: {
    id: string;
    consultationId: string;
    text: string;
    now: string;
  },
): PlatformStore {
  if (
    !mayReadConsultation(store, actor, input.consultationId) ||
    actor.role === "ADMIN"
  )
    throw new Error("Anda bukan peserta konsultasi.");
  const c = store.consultations.find((c) => c.id === input.consultationId)!;
  if (c.status !== "Ongoing")
    throw new Error("Pesan hanya dapat dikirim saat sesi Ongoing.");
  if (!input.text.trim() || input.text.length > 2000)
    throw new Error("Pesan harus berisi 1–2.000 karakter.");
  if (store.platform.messages.some((m) => m.id === input.id)) return store;
  if (actor.role === "LAWYER") {
    const profile = ownedLawyer(store, actor);
    if (!profile?.active || profile.verification !== "Verified")
      throw new Error("Akun pengacara belum aktif dan terverifikasi.");
  }

  return {
    ...store,
    platform: {
      ...store.platform,
      messages: [
        ...store.platform.messages,
        {
          id: input.id,
          consultationId: c.id,
          senderId: actor.id,
          senderName: actor.name,
          role: actor.role,
          text: input.text.trim(),
          createdAt: input.now,
        },
      ],
    },
  };
}

export function saveLawyer(
  store: PlatformStore,
  actor: DemoUser,
  id: string,
  patch: Partial<ManagedLawyer>,
): PlatformStore {
  const current = store.platform.lawyers.find((l) => l.id === id);
  if (
    !current ||
    (actor.role !== "ADMIN" &&
      !(actor.role === "LAWYER" && current.userId === actor.id))
  )
    throw new Error("Profil tidak dapat diakses.");
  let updated: ManagedLawyer;
  if (actor.role === "ADMIN") {
    if (patch.verification && ((current.verification !== "Pending" && !(current.verification === "Verified" && patch.verification === "Rejected")) || !["Verified", "Rejected"].includes(patch.verification)))
      throw new Error("Hanya pengajuan pending yang dapat disetujui atau ditolak.");
    updated = {
      ...current,
      verification: patch.verification ?? current.verification,
      active: patch.active ?? current.active,
    };
  } else {
    const submitting = patch.verification === "Pending";
    if (submitting && !["Unsubmitted", "Rejected", "Verified"].includes(current.verification))
      throw new Error("Pengajuan sudah diproses atau sedang menunggu admin.");
    if (!submitting && (
      (patch.name !== undefined && patch.name.trim() !== current.name) ||
      (patch.specialty !== undefined && patch.specialty !== current.specialty) ||
      (patch.experience !== undefined && patch.experience !== current.experience) ||
      (patch.licenseNumber !== undefined && patch.licenseNumber !== current.licenseNumber) ||
      (patch.organization !== undefined && patch.organization !== current.organization) ||
      (patch.ktaFileName !== undefined && patch.ktaFileName !== current.ktaFileName)
    )) throw new Error("Perubahan data verifikasi harus dikirim sebagai pengajuan ulang.");
    updated = {
      ...current,
      name: patch.name?.trim() ?? current.name,
      bio: patch.bio?.trim() ?? current.bio,
      specialty: patch.specialty ?? current.specialty,
      experience: patch.experience ?? current.experience,
      rate: patch.rate ?? current.rate,
      online: patch.online ?? current.online,
      avatarUrl: patch.avatarUrl ?? current.avatarUrl,
      ...(submitting ? {
        verification: "Pending" as const,
        licenseNumber: patch.licenseNumber?.trim(),
        organization: patch.organization,
        ktaFileName: patch.ktaFileName?.trim(),
      } : {}),
    };
    if (submitting && (!updated.licenseNumber || updated.licenseNumber.length > 100 ||
      !advocateOrganizations.includes(updated.organization as typeof advocateOrganizations[number]) ||
      !updated.ktaFileName || updated.ktaFileName.length > 255 || /[/\\\r\n]/.test(updated.ktaFileName)))
      throw new Error("Lengkapi nomor KTA, organisasi advokat, dan nama file KTA demonstrasi.");
    if (
      !updated.name ||
      updated.name.length > 100 ||
      !updated.bio ||
      updated.bio.length > 2000 ||
      !categories.includes(updated.specialty) ||
      !Number.isSafeInteger(updated.rate) ||
      updated.rate < 1 ||
      updated.rate > 10000 ||
      !Number.isInteger(updated.experience) ||
      updated.experience < 0 ||
      updated.experience > 60
    )
      throw new Error(
        "Periksa nama, deskripsi, pengalaman (0–60 tahun), dan tarif (1–10.000 Coins).",
      );
    if (
      updated.avatarUrl &&
      !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(
        updated.avatarUrl,
      )
    )
      throw new Error("Foto profil tidak valid.");
    if ((updated.avatarUrl?.length ?? 0) > 400000)
      throw new Error("Foto terlalu besar. Maksimal 250 KB.");
  }

  return {
    ...store,
    platform: {
      ...store.platform,
      lawyers: store.platform.lawyers.map((l) => (l.id === id ? updated : l)),
    },
  };
}

export function addReview(
  store: PlatformStore,
  actor: DemoUser,
  id: string,
  rating: number,
  text: string,
): PlatformStore {
  const c = store.consultations.find((c) => c.id === id);
  if (
    !c ||
    actor.role !== "CUSTOMER" ||
    c.customerId !== actor.id ||
    c.status !== "Completed"
  )
    throw new Error("Ulasan hanya untuk konsultasi selesai milik Anda.");
  if (store.platform.reviews.some((r) => r.consultationId === id))
    throw new Error("Konsultasi ini sudah diulas.");
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    text.trim().length < 5 ||
    text.length > 1000
  )
    throw new Error("Pilih rating 1–5 dan tulis ulasan 5–1.000 karakter.");

  return {
    ...store,
    platform: {
      ...store.platform,
      reviews: [
        ...store.platform.reviews,
        {
          id: "review-" + id,
          consultationId: id,
          lawyerId: c.lawyerId,
          customerId: actor.id,
          name: actor.name,
          rating,
          text: text.trim(),
        },
      ],
    },
  };
}

export function earnings(store: CoinStore, lawyerId?: string) {
  const completed = store.consultations.filter(
    (c) => c.status === "Completed" && (!lawyerId || c.lawyerId === lawyerId),
  );
  const gross = completed.reduce((sum, c) => sum + c.rate, 0);
  // Rates are whole Coins; all displayed shares reconcile to this same rule.
  const platform = gross / 5;

  return {
    completed,
    gross,
    platform,
    lawyer: gross - platform,
  };
}
