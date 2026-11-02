import { z } from "zod";
import { env } from "../config/env.js";
import { database } from "../config/supabase.js";
import { check } from "../utils/errors.js";
import { specializations } from "../validators/index.js";
import { SYSTEM_INSTRUCTION } from "./chatbotPrompt.js";

type Specialization = (typeof specializations)[number];
type Urgency = "rendah" | "sedang" | "tinggi";
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}
export interface Triage {
  reply: string;
  specialization: Specialization;
  urgency: Urgency;
}

const responseSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    specialization: { type: "STRING", enum: [...specializations] },
    urgency: { type: "STRING", enum: ["rendah", "sedang", "tinggi"] },
  },
  required: ["reply", "specialization", "urgency"],
};
const triage = z.object({
  reply: z.string().trim().min(1).max(3000),
  specialization: z.enum(specializations),
  urgency: z.enum(["rendah", "sedang", "tinggi"]),
});

async function askGemini(history: ChatTurn[]): Promise<Triage> {
  // Gemini expects the conversation to open with a user turn.
  const turns = history.slice(history.findIndex((m) => m.role === "user"));
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: turns.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
      // Flash-Lite answers in ~2s; a slow model should hit the fallback fast instead of stalling the user.
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("Gemini HTTP " + response.status);
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return triage.parse(
    JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""),
  );
}

// Order matters: danger first, then specific areas before broad ones
// ("warisan keluarga" -> Waris, "suami memukul" -> Pidana, "kerja sama usaha" -> Bisnis).
// Prefixes drop the root's first letter: memukul, menipu, meminjam, memecat, menyewa.
const rules: [RegExp, Specialization, string][] = [
  [
    /pukul|mukul|aniaya|kdrt|kekerasan|ancam|\b(?:men|pen|di|ke)?curi(?:an)?\b|copet|rampok|begal|tipu|nipu|polisi|pidana|ditangkap|penjara|narkoba|pelecehan|perkosa|bunuh|culik/,
    "Hukum Pidana",
    "Simpan bukti (foto, pesan, rekaman, visum bila ada) dan catat kronologi lengkap dengan tanggal.",
  ],
  [
    /waris|peninggalan|wasiat|hibah/,
    "Hukum Waris",
    "Siapkan daftar ahli waris, akta kematian, dan dokumen harta yang ditinggalkan.",
  ],
  [
    /cerai|nikah|perkawinan|hak asuh|nafkah|suami|istri|rumah tangga|gono.?gini|keluarga/,
    "Hukum Keluarga",
    "Siapkan buku nikah, akta kelahiran anak, dan kronologi singkat persoalan keluarga.",
  ],
  [
    /phk|pesangon|gaji|upah|lembur|\bthr\b|kontrak kerja|karyawan|pekerja|buruh|pecat|mecat|resign|tempat kerja|\batasan\b/,
    "Hukum Ketenagakerjaan",
    "Siapkan kontrak kerja, slip gaji, dan komunikasi tertulis dengan perusahaan.",
  ],
  [
    /bisnis|\b(?:peng)?usaha(?:wan)?\b|perusahaan|kemitraan|kerja ?sama|mitra|investor|investasi|saham|\bmerek\b|startup|franchise/,
    "Hukum Bisnis",
    "Siapkan perjanjian kerja sama, akta perusahaan, dan bukti komunikasi antarpihak.",
  ],
  [
    /tanah|sertifikat|\bshm\b|rumah|properti|apartemen|sewa|nyewa|kontrakan|bangunan|girik|\bajb\b|developer/,
    "Hukum Properti",
    "Siapkan sertifikat atau bukti kepemilikan, AJB/perjanjian sewa, dan bukti pembayaran.",
  ],
  [
    /utang|hutang|piutang|pinjam|minjam|perdata|kontrak|perjanjian|ganti rugi|wanprestasi|gugat|sengketa/,
    "Hukum Perdata",
    "Siapkan bukti perjanjian atau transfer, serta percakapan yang menunjukkan kewajiban pihak lain.",
  ],
];
const danger =
  /pukul|mukul|aniaya|kdrt|kekerasan|ancam|bunuh|perkosa|pelecehan|culik|ditangkap/;

export function classify(text: string): Triage {
  const s = text.toLowerCase();
  const rule = rules.find(([pattern]) => pattern.test(s));
  if (!rule)
    return {
      specialization: "Konsultasi Umum",
      urgency: "rendah",
      reply:
        "Terima kasih sudah bercerita. Bisa jelaskan kejadian utamanya, kapan terjadi, dan siapa saja pihak yang terlibat? Sementara itu, pengacara Konsultasi Umum dapat membantu memetakan persoalan Anda.",
    };
  const urgent = danger.test(s);
  return {
    specialization: rule[1],
    urgency: urgent ? "tinggi" : "sedang",
    reply:
      (urgent
        ? "Keselamatan Anda yang utama: jika Anda dalam bahaya, segera hubungi 110 (Polisi) atau 112. "
        : "") +
      `Persoalan ini kemungkinan termasuk ${rule[1]}. ${rule[2]} Penilaian lebih lanjut perlu dibahas bersama pengacara.`,
  };
}

async function recommendLawyers(specialization: Specialization) {
  const { data, error } = await database
    .from("lawyer_profiles")
    .select(
      "id,specialization,experience_years,rate_points,is_online,profiles!inner(full_name,avatar_url)",
    )
    .eq("verification_status", "approved")
    .eq("specialization", specialization)
    .order("is_online", { ascending: false })
    .order("experience_years", { ascending: false })
    .limit(3);
  check(error);
  return data;
}

export async function chat(history: ChatTurn[]) {
  let result: Triage | null = null;
  if (env.GEMINI_API_KEY)
    try {
      result = await askGemini(history);
    } catch (error) {
      console.error(
        "Gemini gagal, memakai fallback:",
        (error as Error).message,
      );
    }
  const source = result ? "gemini" : "fallback";
  // The fallback reads every user turn, so a clarification answer keeps earlier context.
  result ??= classify(
    history
      .filter((m) => m.role === "user")
      .map((m) => m.text)
      .join(" "),
  );
  return {
    ...result,
    source,
    lawyers: await recommendLawyers(result.specialization),
  };
}
