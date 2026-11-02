"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Plus,
  Send,
  ShieldCheck,
  Siren,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { categoryUrl } from "./PublicWebsite";

interface RecommendedLawyer {
  id: string;
  experience_years: number;
  rate_points: number;
  is_online: boolean;
  profiles: { full_name: string };
}
interface Answer {
  reply: string;
  specialization: string;
  urgency: "rendah" | "sedang" | "tinggi";
  source: "gemini" | "fallback";
  lawyers: RecommendedLawyer[];
}
type Message = { id: string; role: "assistant" | "user"; text: string } & Partial<
  Omit<Answer, "reply">
>;

const welcome: Message = {
  id: "welcome",
  role: "assistant",
  text: "Halo, saya HiLaw Assistant. Ceritakan singkat persoalan Anda. Saya bantu kenali bidang hukumnya dan pengacara yang sesuai.",
};

export function Chatbot() {
  // Kept in memory only: stories about legal problems are sensitive, so nothing is saved in the browser.
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || typing) return;
    const history = [
      ...messages.filter((m) => m.id !== welcome.id && !m.id.startsWith("error-")),
      { id: crypto.randomUUID(), role: "user" as const, text: value },
    ];
    setMessages((m) => [...m, history[history.length - 1]]);
    setInput("");
    setTyping(true);
    try {
      const { reply, ...answer } = await api<Answer>(
        "/chatbot",
        {
          method: "POST",
          body: JSON.stringify({
            messages: history.slice(-10).map(({ role, text }) => ({ role, text })),
          }),
        },
        false,
      );
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: reply, ...answer },
      ]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          id: "error-" + crypto.randomUUID(),
          role: "assistant",
          text: (error as Error).message + " Silakan coba kirim lagi.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="container section chatbot-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LANGKAH PERTAMA, CERITAKAN SAJA</span>
          <h1>Mari pahami persoalan Anda.</h1>
          <p>Temukan arah awal dan pengacara yang tepat bersama HiLaw Assistant.</p>
        </div>
      </div>
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <span className="icon-box">
            <Sparkles size={28} />
          </span>
          <h2>
            Tak perlu memahami
            <br />
            semuanya sendiri.
          </h2>
          <p>
            Ceritakan dengan bahasa Anda. Kami bantu kenali bidang hukum dan
            spesialis yang relevan.
          </p>
          <button
            className="button outline"
            onClick={() => {
              setMessages([welcome]);
              setInput("");
            }}
            disabled={typing}
          >
            <Plus size={17} />
            Percakapan baru
          </button>
          <div className="chat-side-note">
            <ShieldCheck size={21} />
            <p>
              Percakapan tidak disimpan. Hindari membagikan NIK, nomor rekening,
              atau dokumen pribadi.
            </p>
          </div>
        </aside>
        <div className="chat-panel">
          <header>
            <span className="assistant-avatar">
              <Bot size={23} />
            </span>
            <div>
              <strong>HiLaw Assistant</strong>
              <small>Asisten triase hukum · Gemini AI</small>
            </div>
            <span className="assistant-status">Siap membantu</span>
          </header>
          <div
            className="chat-messages"
            role="log"
            aria-label="Percakapan HiLaw Assistant"
            aria-live="polite"
          >
            {messages.map((m) => (
              <div className={"message " + m.role} key={m.id}>
                {m.role === "assistant" && <Bot size={19} />}
                <div>
                  {m.urgency === "tinggi" && (
                    <p className="urgent-note" role="alert">
                      <Siren size={15} /> Darurat? Hubungi 110 (Polisi) atau 112.
                    </p>
                  )}
                  <p>{m.text}</p>
                  {m.specialization && (
                    <div className="chat-advice">
                      <span className="tag">Rekomendasi: {m.specialization}</span>
                      {m.lawyers?.map((l) => (
                        <Link
                          key={l.id}
                          className="chat-lawyer"
                          href={"/lawyers/" + l.id}
                        >
                          <span>
                            <strong>{l.profiles.full_name}</strong>
                            <small>
                              {l.experience_years} tahun · {l.rate_points} Poin ·{" "}
                              {l.is_online ? "Tersedia" : "Offline"}
                            </small>
                          </span>
                          <ArrowUpRight size={15} />
                        </Link>
                      ))}
                      <Link
                        className="chat-recommendation"
                        href={categoryUrl(m.specialization)}
                      >
                        {m.lawyers?.length
                          ? "Lihat semua pengacara " + m.specialization
                          : "Cari pengacara " + m.specialization}
                        <ArrowUpRight size={15} />
                      </Link>
                      {m.source === "fallback" && (
                        <small className="muted">
                          Mode cadangan (tanpa AI) sedang digunakan.
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="message assistant">
                <Bot size={19} />
                <p className="typing" role="status">
                  HiLaw Assistant sedang mengetik<span>…</span>
                </p>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="chat-bottom">
            {messages.length === 1 && (
              <div className="suggestions">
                {[
                  "Saya ingin mengurus perceraian",
                  "Gaji saya belum dibayar",
                  "Saya punya sengketa tanah",
                ].map((q) => (
                  <button disabled={typing} key={q} onClick={() => send(q)}>
                    {q}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                aria-label="Pesan untuk HiLaw Assistant"
                maxLength={2000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ceritakan persoalan hukum Anda…"
              />
              <button
                className="button"
                aria-label="Kirim pesan"
                disabled={!input.trim() || typing}
              >
                <Send size={19} />
              </button>
            </form>
            <p className="disclaimer">
              Informasi bersifat umum dan bukan pengganti nasihat hukum
              profesional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
