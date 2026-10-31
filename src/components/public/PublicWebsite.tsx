"use client";
import { Toast } from "@/components/ui/Toast";

import Link from "next/link";
import { useCoins, usePublicLawyers } from "@/store/CoinProvider";
import { ConsultationBooking } from "@/components/customer/ConsultationBooking";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Scale,
  ShieldCheck,
  MessageCircle,
  BriefcaseBusiness,
  Users,
  Building2,
  House,
  Gavel,
  ScrollText,
  Sparkles,
  Star,
  Check,
  LockKeyhole,
  Coins,
  Search,
  SlidersHorizontal,
  Send,
  Plus,
  Bot,
  Clock,
  ChevronRight,
  CircleCheck,
} from "lucide-react";
import {
  categories,
  type PublicLawyer,
  type PublicCategory,
} from "@/data/publicData";

const icons = [
  Gavel,
  ScrollText,
  Users,
  BriefcaseBusiness,
  House,
  Building2,
  Scale,
  MessageCircle,
];

const categoryUrl = (category: string) =>
  "/lawyers?category=" + encodeURIComponent(category);

export function Portrait({ lawyer }: { lawyer: PublicLawyer }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="portrait">
      {failed || (!lawyer.photo && !lawyer.avatarUrl) ? (
        <span>
          {lawyer.name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")}
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */ <img
          src={
            lawyer.avatarUrl || "https://i.pravatar.cc/240?img=" + lawyer.photo
          }
          alt={"Foto ilustrasi " + lawyer.name}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function LawyerCard({ lawyer: l }: { lawyer: PublicLawyer }) {
  return (
    <article className="lawyer-card">
      <div className="lawyer-top">
        <Portrait lawyer={l} />
        <span className={"availability " + (l.online ? "online" : "")}>
          <i />
          {l.online ? "Tersedia" : "Terjadwal"}
        </span>
      </div>
      <span className="eyebrow">{l.specialty}</span>
      <h3>{l.name}</h3>
      <p className="meta">
        <BriefcaseBusiness size={14} />
        {l.experience} tahun pengalaman <span>·</span>
        <Star size={14} />
        {l.rating}
      </p>
      <p className="verified">
        <ShieldCheck size={14} /> Terverifikasi{" "}
        <span className="muted">(demo)</span>
      </p>
      <div className="card-price">
        <div>
          <strong>
            {l.rate} <small>Coins</small>
          </strong>
          <span>/ 30 menit</span>
        </div>
        <span className="muted">
          Rp{(l.rate * 1000).toLocaleString("id-ID")}
        </span>
      </div>
      <div className="card-actions">
        <Link className="button outline" href={"/lawyers/" + l.id}>
          Lihat Profil
        </Link>
        <Link className="button" href={"/lawyers/" + l.id + "#consult"}>
          Konsultasi <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export function Landing() {
  const lawyers = usePublicLawyers();

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="label">
              <span className="tiny-dot" /> Ruang aman untuk cerita Anda
            </span>
            <h1>
              Bantuan Hukum,
              <br />
              Kini Lebih <span>Mudah.</span>
            </h1>
            <p className="hero-copy">
              Konsultasikan permasalahan hukum Anda dan temukan pengacara yang
              tepat, kapan saja dan di mana saja.
            </p>
            <div className="button-row">
              <Link className="button" href="/lawyers">
                Cari Pengacara <ArrowUpRight size={18} />
              </Link>
              <Link className="button outline" href="/chatbot">
                <MessageCircle size={18} />
                Tanya Chatbot
              </Link>
            </div>
            <div className="hero-note">
              <ShieldCheck size={18} />
              <span>Lebih tenang memulai langkah hukum Anda.</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Ilustrasi konsultasi hukum">
            <div className="visual-circle" />
            <div className="consult-window">
              <div className="window-bar">
                <div className="window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>Konsultasi bersama HiLaw</span>
                <LockKeyhole size={13} />
              </div>
              <div className="visual-scene">
                <div className="scene-shelf">
                  <span />
                  <span />
                  <span />
                  <Scale size={42} />
                </div>
                <div className="person-head" />
                <div className="person-hair" />
                <div className="person-body" />
                <div className="person-shirt" />
                <div className="person-laptop">
                  <Scale size={35} />
                </div>
              </div>
              <div className="window-footer">
                <div>
                  <strong>Nadira Putri, S.H., M.H.</strong>
                  <span>Pengacara Hukum Keluarga</span>
                </div>
                <span className="call-icon">
                  <MessageCircle size={19} />
                </span>
              </div>
            </div>
            <div className="float-card trust-float">
              <span className="icon-box">
                <ShieldCheck />
              </span>
              <div>
                <strong>Pengacara terverifikasi</strong>
                <small>Pendampingan yang profesional</small>
              </div>
              <CircleCheck size={18} />
            </div>
            <div className="float-card chat-float">
              <span className="icon-box">
                <MessageCircle size={19} />
              </span>
              <div>
                <strong>Mulai dari sebuah cerita</strong>
                <small>Kami bantu temukan arahnya.</small>
              </div>
            </div>
            <span className="visual-caption">
              LANGKAH KECIL. KETENANGAN BESAR.
            </span>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container">
          {[
            [ShieldCheck, "Mitra profesional"],
            [LockKeyhole, "Privasi konsultasi"],
            [Coins, "Biaya transparan"],
            [MessageCircle, "Konsultasi dari mana saja"],
          ].map(([Icon, text]) => {
            const I = Icon as typeof ShieldCheck;

            return (
              <span key={String(text)}>
                <I size={20} />
                {String(text)}
              </span>
            );
          })}
        </div>
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TEMUKAN ARAH YANG TEPAT</span>
            <h2>Apa yang ingin Anda konsultasikan?</h2>
            <p>
              Setiap masalah punya jalan. Mulai dari bidang hukum yang sesuai.
            </p>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => {
            const Icon = icons[i];

            return (
              <Link className="category-card" href={categoryUrl(c)} key={c}>
                <span className="icon-box">
                  <Icon size={25} />
                </span>
                <strong>{c}</strong>
                <ArrowUpRight size={17} />
              </Link>
            );
          })}
        </div>
        <div className="assistant-banner">
          <span className="icon-box">
            <Sparkles />
          </span>
          <div>
            <strong>Belum tahu harus mulai dari mana?</strong>
            <p>
              Ceritakan pada HiLaw Assistant. Kami bantu kenali kategori masalah
              Anda.
            </p>
          </div>
          <Link href="/chatbot">
            Tanya Chatbot <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <section className="tinted">
        <div className="container section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">KENALI PENDAMPING ANDA</span>
              <h2>Pengacara pilihan untuk Anda</h2>
              <p>Temukan teman diskusi yang memahami kebutuhan hukum Anda.</p>
            </div>
            <Link className="text-link" href="/lawyers">
              Lihat semua pengacara <ArrowRight size={17} />
            </Link>
          </div>
          <div className="lawyer-grid">
            {lawyers.slice(0, 3).map((l) => (
              <LawyerCard key={l.id} lawyer={l} />
            ))}
          </div>
          <p className="demo-note">
            Profil dan verifikasi bersifat simulasi. Rating menggabungkan data
            awal dan ulasan demo. Foto hanya ilustrasi.
          </p>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading centered">
          <span className="eyebrow">SEDERHANA DI SETIAP LANGKAH</span>
          <h2>Dari cerita, menuju solusi.</h2>
          <p>Empat langkah mudah untuk mendapatkan pendampingan hukum.</p>
        </div>
        <div className="steps">
          {[
            [
              "Ceritakan masalah Anda",
              "Mulai dengan chatbot untuk mengenali kebutuhan hukum Anda.",
            ],
            [
              "Temukan pengacara",
              "Pilih spesialis yang sesuai dengan kebutuhan dan anggaran.",
            ],
            [
              "Top Up HiLaw Coins",
              "Siapkan saldo dengan biaya yang jelas. 1 Coin = Rp1.000.",
            ],
            [
              "Mulai konsultasi",
              "Diskusikan persoalan Anda dengan pengacara pilihan.",
            ],
          ].map(([title, desc], i) => (
            <div key={title}>
              <span className="step-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container">
        <div className="benefits">
          <div>
            <span className="eyebrow">HUKUM TERASA LEBIH DEKAT</span>
            <h2>
              Pendampingan yang baik
              <br />
              dimulai dari rasa percaya.
            </h2>
            <p>
              Kami membuat langkah pertama Anda terasa lebih mudah, jelas, dan
              nyaman.
            </p>
            <Link className="text-link" href="/lawyers">
              Temukan pengacara Anda <ArrowRight size={17} />
            </Link>
          </div>
          <div className="benefit-list">
            {[
              "Pengacara terverifikasi",
              "Konsultasi online",
              "Harga transparan",
              "Mudah digunakan",
              "Privasi konsultasi",
            ].map((t) => (
              <div key={t}>
                <Check size={18} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section faq-layout">
        <div>
          <span className="eyebrow">KAMI BANTU JAWAB</span>
          <h2>Masih ada pertanyaan?</h2>
          <p>Kenali HiLaw lebih dekat sebelum memulai.</p>
        </div>
        <div>
          {[
            [
              "Bagaimana cara mencari pengacara?",
              "Buka Cari Pengacara, lalu gunakan pencarian nama dan filter spesialisasi, tarif, rating, atau pengalaman. Klik Lihat Profil untuk mengenal pengacara.",
            ],
            [
              "Bagaimana cara menggunakan chatbot?",
              "Buka Chatbot, ketik gambaran masalah Anda, atau pilih pertanyaan yang disarankan. Assistant memberikan respons simulasi dan tautan kategori yang relevan.",
            ],
            [
              "Bagaimana cara membeli HiLaw Coins?",
              "Masuk sebagai Customer, buka HiLaw Coins, pilih paket dan metode pembayaran simulasi, lalu konfirmasi. Nilai demonstrasi 1 Coin = Rp1.000. Tidak ada pembayaran asli.",
            ],
            [
              "Bagaimana cara melakukan konsultasi?",
              "Pilih pengacara dan buka profilnya. Masuk sebagai Customer, pilih pengacara yang tersedia, lalu konfirmasi pembayaran Coins pada profilnya. Permintaan akan menunggu konfirmasi pengacara.",
            ],
            [
              "Di mana saya melihat riwayat konsultasi?",
              "Buka dashboard Customer lalu pilih Konsultasi Saya untuk melihat status dan detail konsultasi. Riwayat pembayaran tersedia di Riwayat Transaksi.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={17} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

export function Footer() {
  const { state } = useCoins();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand">
            <Scale size={28} />
            {state.platform.settings.platformName}.
          </Link>
          <p>
            Langkah pertama untuk
            <br />
            ketenangan hukum Anda.
          </p>
        </div>
        <div>
          <strong>Jelajahi HiLaw</strong>
          <Link href="/">Beranda</Link>
          <Link href="/chatbot">HiLaw Assistant</Link>
          <Link href="/lawyers">Cari Pengacara</Link>
        </div>
        <div>
          <strong>Hubungi kami</strong>
          <span>{state.platform.settings.contact}</span>
          <span>Jakarta, Indonesia</span>
          <small>Kontak placeholder</small>
        </div>
        <div className="footer-note">
          <ShieldCheck size={25} />
          <p>
            Ruang untuk memahami.
            <br />
            Teman untuk melangkah.
          </p>
          <small>Prototipe frontend · Phase 6</small>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 HiLaw. Semua hak dilindungi.</span>
        <span>Dibuat untuk mendekatkan akses hukum.</span>
      </div>
    </footer>
  );
}

export function Directory() {
  const lawyers = usePublicLawyers();
  const params = useSearchParams();
  const initial = params.get("category") || "";
  const [query, setQuery] = useState("");
  const [categorySelection, setCategorySelection] = useState({
    source: initial,
    value: categories.includes(initial as PublicCategory) ? initial : "",
  });
  const category =
    categorySelection.source === initial
      ? categorySelection.value
      : categories.includes(initial as PublicCategory)
        ? initial
        : "";
  function setCategory(value: string) {
    setCategorySelection({ source: initial, value });
  }
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [rating, setRating] = useState("");
  const [experience, setExperience] = useState("");
  const [sort, setSort] = useState("recommended");
  const priceCeiling =
    Math.ceil(
      Math.max(
        100,
        priceMin,
        priceMax ?? 0,
        ...lawyers.map((lawyer) => lawyer.rate),
      ) / 50,
    ) * 50;
  const selectedMax = priceMax ?? priceCeiling;
  function changeMin(value: number) {
    const next = Math.max(0, Math.min(10000, Math.round(value)));
    setPriceMin(next);
    if (priceMax !== null && next > priceMax) setPriceMax(next);
  }
  function changeMax(value: number) {
    const next = Math.max(0, Math.min(10000, Math.round(value)));
    setPriceMax(next);
    if (next < priceMin) setPriceMin(next);
  }
  const results = lawyers
    .filter(
      (l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) &&
        (!category || l.specialty === category) &&
        l.rate >= priceMin &&
        (priceMax === null || l.rate <= priceMax) &&
        (!rating || l.rating >= Number(rating)) &&
        (!experience || l.experience >= Number(experience)),
    )
    .sort((a, b) =>
      sort === "price-asc"
        ? a.rate - b.rate
        : sort === "price-desc"
          ? b.rate - a.rate
          : sort === "rating"
            ? b.rating - a.rating
            : 0,
    );

  function reset() {
    setQuery("");
    setCategory("");
    setPriceMin(0);
    setPriceMax(null);
    setRating("");
    setExperience("");
    setSort("recommended");
  }

  return (
    <>
      <div className="page-intro tinted">
        <div className="container">
          <span className="eyebrow">PENDAMPING YANG TEPAT UNTUK ANDA</span>
          <h1>Temukan pengacara Anda.</h1>
          <p>
            Pilih keahlian, kenali pengacaranya, dan mulai dengan lebih tenang.
          </p>
        </div>
      </div>
      <div className="container directory-layout section">
        <aside className="filters">
          <div className="filter-title">
            <strong>
              <SlidersHorizontal size={18} /> Filter pencarian
            </strong>
            <button onClick={reset}>Reset</button>
          </div>
          <label>
            Spesialisasi
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Semua spesialisasi</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <fieldset className="price-range-filter">
            <legend>Rentang tarif (Coins)</legend>
            <div className="price-range-values">
              <label>
                Dari
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10000}
                  step={1}
                  value={priceMin}
                  onChange={(e) => changeMin(Number(e.target.value))}
                />
              </label>
              <span aria-hidden="true">-</span>
              <label>
                Sampai
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10000}
                  step={1}
                  value={selectedMax}
                  onChange={(e) =>
                    e.target.value === ""
                      ? setPriceMax(null)
                      : changeMax(Number(e.target.value))
                  }
                />
              </label>
            </div>
            <div className="price-range-slider">
              <div className="price-range-track" aria-hidden="true">
                <div
                  style={{
                    left: `${(priceMin / priceCeiling) * 100}%`,
                    right: `${100 - (selectedMax / priceCeiling) * 100}%`,
                  }}
                />
              </div>
              <input
                type="range"
                aria-label="Tarif minimum dalam Coins"
                min={0}
                max={priceCeiling}
                step={1}
                value={priceMin}
                style={{ zIndex: priceMin === priceCeiling ? 3 : 2 }}
                onChange={(e) =>
                  changeMin(Math.min(Number(e.target.value), selectedMax))
                }
              />
              <input
                type="range"
                aria-label="Tarif maksimum dalam Coins"
                min={0}
                max={priceCeiling}
                step={1}
                value={selectedMax}
                onChange={(e) =>
                  changeMax(Math.max(Number(e.target.value), priceMin))
                }
              />
            </div>
            <p>
              {priceMin.toLocaleString("id-ID")} -{" "}
              {selectedMax.toLocaleString("id-ID")} Coins / 30 menit
            </p>
          </fieldset>
          <label>
            Rating minimum
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="">Semua rating</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pengalaman
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="">Semua pengalaman</option>
              <option value="5">5+ tahun</option>
              <option value="10">10+ tahun</option>
            </select>
          </label>
          <div className="filter-tip">
            <ShieldCheck size={24} />
            <strong>Kenali sebelum memilih</strong>
            <p>Bandingkan keahlian dan tarif sesuai kebutuhan Anda.</p>
          </div>
        </aside>
        <div>
          <div className="search-field">
            <Search size={19} />
            <input
              aria-label="Cari nama pengacara"
              placeholder="Cari nama pengacara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="results-bar">
            <span aria-live="polite">
              <strong>{results.length}</strong> pengacara ditemukan
            </span>
            <label>
              Urutkan:{" "}
              <select
                aria-label="Urutan pengacara"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recommended">Rekomendasi</option>
                <option value="price-asc">Harga terendah</option>
                <option value="price-desc">Harga tertinggi</option>
                <option value="rating">Rating tertinggi</option>
              </select>
            </label>
          </div>
          {results.length ? (
            <div className="directory-cards">
              {results.map((l) => (
                <LawyerCard key={l.id} lawyer={l} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={35} />
              <h2>Belum ada yang sesuai</h2>
              <p>Coba nama lain atau kurangi filter pencarian Anda.</p>
              <button className="button outline" onClick={reset}>
                Reset pencarian
              </button>
            </div>
          )}
          <p className="demo-note">
            Profil dan verifikasi bersifat fiktif untuk demo. Foto hanya
            ilustrasi.
          </p>
        </div>
      </div>
    </>
  );
}

export function LawyerDetail({ lawyer: l }: { lawyer: PublicLawyer }) {
  const { state } = useCoins();
  const reviews = state.platform.reviews.filter((r) => r.lawyerId === l.id);

  return (
    <div className="container section">
      <div className="breadcrumb">
        <Link href="/lawyers">Cari Pengacara</Link>
        <ChevronRight size={14} />
        {l.name}
      </div>
      <div className="detail-layout">
        <div>
          <article className="profile-card">
            <Portrait lawyer={l} />
            <div>
              <span className="eyebrow">{l.specialty}</span>
              <h1>{l.name}</h1>
              <p className="verified">
                <ShieldCheck size={17} />
                Terverifikasi · Data demonstrasi
              </p>
              <p className="meta">
                <BriefcaseBusiness size={16} />
                {l.experience} tahun pengalaman <Star size={16} />
                {l.rating} ({l.reviews} ulasan demo)
              </p>
            </div>
          </article>
          <section className="detail-section">
            <h2>Mengenal pengacara</h2>
            <p>{l.bio}</p>
            <p>
              Seluruh profil merupakan identitas fiktif untuk demonstrasi
              layanan HiLaw.
            </p>
          </section>
          <section className="detail-section">
            <h2>Bidang pendampingan</h2>
            <span className="tag">{l.specialty}</span>
            <p>
              Konsultasikan kronologi, dokumen yang tersedia, serta tujuan Anda
              agar pembahasan lebih terarah.
            </p>
          </section>
          <section className="detail-section">
            <h2>Ulasan konsultasi</h2>
            {reviews.map((r) => (
              <div className="review" key={r.id}>
                <strong>{r.name} · Customer demo</strong>
                <span>{r.rating}/5</span>
                <p>{r.text}</p>
              </div>
            ))}
            <p className="rating-large">
              <Star /> {l.rating} <small>/ 5 · {l.reviews} ulasan demo</small>
            </p>
            {[
              [
                "Aulia · Customer demo",
                "Penjelasannya mudah dipahami dan membantu saya menyusun pertanyaan selanjutnya.",
              ],
              [
                "Dimas · Customer demo",
                "Pendekatannya ramah dan pembahasannya terstruktur.",
              ],
            ].map(([name, text]) => (
              <div className="review" key={name}>
                <strong>{name}</strong>
                <span>★★★★★</span>
                <p>{text}</p>
              </div>
            ))}
          </section>
        </div>
        <aside className="booking-card" id="consult">
          <span className="eyebrow">MULAI LANGKAH ANDA</span>
          <h2>Konsultasi online</h2>
          <span className={"availability " + (l.online ? "online" : "")}>
            <i />
            {l.online ? "Tersedia untuk konsultasi" : "Konsultasi terjadwal"}
          </span>
          <div className="booking-price">
            {l.rate} <span>HiLaw Coins</span>
          </div>
          <p>Rp{(l.rate * 1000).toLocaleString("id-ID")} / sesi</p>
          <hr />
          <p className="meta">
            <MessageCircle size={18} />
            Konsultasi chat
          </p>
          <p className="meta">
            <Clock size={18} />
            Durasi 30 menit
          </p>
          <p className="meta">
            <Coins size={18} />1 Coin = Rp1.000
          </p>
          <ConsultationBooking lawyer={l} />
        </aside>
      </div>
    </div>
  );
}

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  category?: PublicCategory;
};

const welcome: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Halo, saya HiLaw Assistant. Ceritakan singkat persoalan Anda. Saya akan membantu mengenali bidang hukum yang mungkin relevan.",
};

function answer(text: string): Omit<ChatMessage, "id" | "role"> {
  const s = text.toLowerCase();
  const rules: [RegExp, PublicCategory, string][] = [
    [
      /cerai|nikah|asuh|keluarga/,
      "Hukum Keluarga",
      "Persoalan ini mungkin berkaitan dengan hukum keluarga. Siapkan kronologi dan dokumen terkait agar pengacara dapat memahami kondisi Anda.",
    ],
    [
      /waris|peninggalan/,
      "Hukum Waris",
      "Persoalan ini mungkin berkaitan dengan hukum waris. Catat hubungan keluarga dan dokumen harta yang tersedia untuk dibahas bersama pengacara.",
    ],
    [
      /phk|gaji|kerja|upah/,
      "Hukum Ketenagakerjaan",
      "Persoalan ini mungkin berkaitan dengan ketenagakerjaan. Siapkan kontrak kerja, bukti pembayaran, dan komunikasi terkait.",
    ],
    [
      /tanah|rumah|properti|sertifikat/,
      "Hukum Properti",
      "Persoalan ini mungkin berkaitan dengan hukum properti. Kumpulkan dokumen kepemilikan dan kronologi kejadian.",
    ],
    [
      /pidana|curi|tipu|polisi|kekerasan/,
      "Hukum Pidana",
      "Persoalan ini mungkin berkaitan dengan hukum pidana. Catat kronologi dan simpan bukti yang tersedia untuk dibahas bersama pengacara.",
    ],
    [
      /bisnis|usaha|perusahaan|kemitraan/,
      "Hukum Bisnis",
      "Persoalan ini mungkin berkaitan dengan hukum bisnis. Siapkan perjanjian dan komunikasi para pihak untuk konsultasi.",
    ],
    [
      /utang|hutang|piutang|perdata|kontrak/,
      "Hukum Perdata",
      "Persoalan ini mungkin berkaitan dengan hukum perdata. Siapkan perjanjian, bukti pembayaran, dan komunikasi terkait.",
    ],
  ];
  const rule = rules.find(([regex]) => regex.test(s));

  return rule
    ? {
        text:
          rule[2] +
          " Penilaian lebih lanjut memerlukan pembahasan dengan profesional.",
        category: rule[1],
      }
    : {
        text: "Terima kasih sudah bercerita. Bisa jelaskan kejadian utama dan pihak yang terlibat? Jika belum yakin bidangnya, pengacara konsultasi umum dapat membantu memetakan persoalan Anda.",
        category: "Konsultasi Umum",
      };
}

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("hilaw-public-chat-v1") || "null",
      );
      if (
        Array.isArray(saved) &&
        saved.length &&
        saved.every(
          (m) =>
            typeof m.id === "string" &&
            ["user", "assistant"].includes(m.role) &&
            typeof m.text === "string" &&
            (!m.category || categories.includes(m.category)),
        )
      )
        setMessages(saved);
    } catch {
      setNotice("Riwayat tidak dapat dimuat. Percakapan baru siap digunakan.");
    }
    setReady(true);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("hilaw-public-chat-v1", JSON.stringify(messages));
      } catch {
        setNotice(
          "Penyimpanan browser tidak tersedia. Chat tetap dapat digunakan selama halaman terbuka.",
        );
      }
  }, [messages, ready]);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [messages, typing]);

  function send(text: string) {
    const value = text.trim();
    if (!value || typing || !ready) return;
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: value,
      },
    ]);
    setInput("");
    setTyping(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          ...answer(value),
        },
      ]);
      setTyping(false);
    }, 650);
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setTyping(false);
    setMessages([welcome]);
    setInput("");
    setNotice("Percakapan baru siap dimulai.");
  }

  return (
    <div className="container section chatbot-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LANGKAH PERTAMA, CERITAKAN SAJA</span>
          <h1>Mari pahami persoalan Anda.</h1>
          <p>Temukan arah awal bersama HiLaw Assistant.</p>
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
            Ceritakan dengan bahasa Anda. Kami bantu kenali bidang hukum yang
            relevan.
          </p>
          <button className="button outline" onClick={reset} disabled={!ready}>
            <Plus size={17} />
            New Chat
          </button>
          <div className="chat-side-note">
            <ShieldCheck size={21} />
            <p>
              Hindari membagikan NIK, nomor rekening, atau dokumen pribadi dalam
              percakapan demo.
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
              <small>Asisten panduan awal · Simulasi</small>
            </div>
            <span className="assistant-status">Siap membantu</span>
          </header>
          <div
            className="chat-messages"
            role="log"
            aria-label="Percakapan HiLaw Assistant"
            aria-live="polite"
          >
            {!ready ? (
              <p role="status">Memuat percakapan…</p>
            ) : (
              messages.map((m) => (
                <div className={"message " + m.role} key={m.id}>
                  {m.role === "assistant" && <Bot size={19} />}
                  <div>
                    <p>{m.text}</p>
                    {m.category && (
                      <Link
                        className="chat-recommendation"
                        href={categoryUrl(m.category)}
                      >
                        Cari Pengacara {m.category}
                        <ArrowUpRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
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
                  <button
                    disabled={typing || !ready}
                    key={q}
                    onClick={() => send(q)}
                  >
                    {q}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                aria-label="Pesan untuk HiLaw Assistant"
                maxLength={2000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ceritakan persoalan hukum Anda…"
                disabled={!ready}
              />
              <button
                className="button"
                aria-label="Kirim pesan"
                disabled={!input.trim() || typing || !ready}
              >
                <Send size={19} />
              </button>
            </form>
            <p className="disclaimer">
              Informasi yang diberikan bersifat umum dan bukan pengganti nasihat
              hukum profesional.
            </p>
          </div>
        </div>
      </div>
      <Toast message={notice} onClose={() => setNotice("")} />
    </div>
  );
}

export function ManagedLawyerDetail({ id }: { id: string }) {
  const { ready, error } = useCoins();
  const lawyers = usePublicLawyers();
  const lawyer = lawyers.find((l) => l.id === id);
  if (!ready)
    return (
      <div className="container section" role="status">
        Memuat profil pengacara…
      </div>
    );
  if (error || !lawyer)
    return (
      <div className="container section empty-state">
        <h1>Profil tidak tersedia</h1>
        <p>{error || "Pengacara belum aktif atau belum terverifikasi."}</p>
        <Link className="button outline" href="/lawyers">
          Kembali ke direktori
        </Link>
      </div>
    );

  return <LawyerDetail lawyer={lawyer} />;
}
