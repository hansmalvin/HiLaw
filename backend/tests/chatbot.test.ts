import test from "node:test";
import assert from "node:assert/strict";
// Transport doubles only: no live Gemini or Supabase calls.
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.SUPABASE_URL = "https://supabase.test";
process.env.SUPABASE_ANON_KEY = "test-anon-not-a-credential";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-not-a-credential";
process.env.GEMINI_API_KEY = "test-gemini-not-a-credential";
let geminiReply: unknown;
let geminiBody: { contents: { role: string }[] } | null = null;
let lawyerQuery = "";
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.startsWith("https://generativelanguage.googleapis.com/")) {
    assert.equal(
      new Headers(init?.headers).get("x-goog-api-key"),
      "test-gemini-not-a-credential",
    );
    geminiBody = JSON.parse(String(init?.body));
    return Response.json({
      candidates: [
        { content: { parts: [{ text: JSON.stringify(geminiReply) }] } },
      ],
    });
  }
  if (url.includes("/rest/v1/lawyer_profiles")) {
    lawyerQuery = decodeURIComponent(url);
    return Response.json([{ id: "lawyer-1", is_online: true }]);
  }
  throw new Error("Unexpected request: " + url);
};
const { classify, chat } = await import("../src/services/chatbot.js");

test("fallback routes the PRD cases to the right specialist", () => {
  for (const [story, expected] of [
    ["Suami saya sering memukul saya di rumah", "Hukum Pidana"],
    ["Saya ingin bercerai dan mengurus hak asuh anak", "Hukum Keluarga"],
    ["Saya di-PHK tanpa pesangon", "Hukum Ketenagakerjaan"],
    ["Sertifikat tanah saya dipakai orang lain", "Hukum Properti"],
    ["Pembagian harta peninggalan orang tua tidak adil", "Hukum Waris"],
    ["Teman meminjam uang dan tidak mau membayar", "Hukum Perdata"],
    ["Mitra bisnis melanggar perjanjian kerja sama usaha", "Hukum Bisnis"],
    // Former keyword traps: "rumah tangga", "curiga", "mereka", "berusaha".
    ["Ada masalah rumah tangga dengan istri", "Hukum Keluarga"],
    ["Saya curiga mereka berusaha menunda pembayaran utang", "Hukum Perdata"],
    ["Perusahaan belum membayar gaji saya", "Hukum Ketenagakerjaan"],
    ["Halo, saya bingung", "Konsultasi Umum"],
  ])
    assert.equal(classify(story).specialization, expected, story);
});

test("danger raises urgency and points to emergency numbers", () => {
  const result = classify("Saya diancam akan dipukul");
  assert.equal(result.urgency, "tinggi");
  assert.match(result.reply, /110/);
  assert.equal(classify("Saya di-PHK").urgency, "sedang");
});

test("Gemini triage is used and matched to approved lawyers in that field", async () => {
  geminiReply = {
    reply: "Ini termasuk ketenagakerjaan.",
    specialization: "Hukum Ketenagakerjaan",
    urgency: "sedang",
  };
  const result = await chat([
    { role: "assistant", text: "Halo, ada yang bisa dibantu?" },
    { role: "user", text: "Gaji saya ditahan" },
  ]);
  assert.equal(result.source, "gemini");
  assert.equal(result.specialization, "Hukum Ketenagakerjaan");
  assert.deepEqual(result.lawyers, [{ id: "lawyer-1", is_online: true }]);
  // Leading assistant greeting is dropped; Gemini conversations start with a user turn.
  assert.deepEqual(
    geminiBody!.contents.map((c) => c.role),
    ["user"],
  );
  assert.match(lawyerQuery, /specialization=eq\.Hukum.Ketenagakerjaan/);
  assert.match(lawyerQuery, /verification_status=eq\.approved/);
});

test("an invalid Gemini answer falls back to the keyword classifier", async () => {
  geminiReply = { reply: "x", specialization: "Hukum Antariksa", urgency: "?" };
  const result = await chat([{ role: "user", text: "Sengketa tanah warisan" }]);
  assert.equal(result.source, "fallback");
  assert.equal(result.specialization, "Hukum Waris");
});
