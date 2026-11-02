"use client";
import Link from "next/link";
import { useCoins, usePublicLawyers } from "@/store/CoinProvider";
import { ConsultationBooking } from "@/components/customer/ConsultationBooking";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ManagedLawyer } from "@/store/platform";
import { packagePrice, SESSION_PACKAGES } from "@/store/coinLedger";
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
  Plus,
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

export const categoryUrl = (category: string) =>
  "/lawyers?category=" + encodeURIComponent(category);

export function Portrait({ lawyer }: { lawyer: PublicLawyer }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="portrait">
      {failed || !lawyer.avatarUrl ? (
        <span>
          {lawyer.name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")}
        </span>
      ) : (
        // Remote avatar URLs come from Supabase Storage; next/image would need remotePatterns config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lawyer.avatarUrl}
          alt={"Foto " + lawyer.name}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

// Placeholder cards keep the grid's shape while the lawyer list loads.
function CardSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="lawyer-card skeleton" aria-hidden="true" />
  ));
}

export function LawyerCard({ lawyer: l }: { lawyer: ManagedLawyer }) {
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
        {l.reviews ? l.rating : "Baru"}
      </p>
      <p className="verified">
        <ShieldCheck size={14} /> Terverifikasi {l.organization}
      </p>
      <div className="card-price">
        <div>
          <strong>
            {l.rate} <small>Poin</small>
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
  const { ready, error } = useCoins();

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
          <div className="lawyer-grid" aria-busy={!ready}>
            {ready
              ? lawyers
                  .slice(0, 3)
                  .map((l) => <LawyerCard key={l.id} lawyer={l} />)
              : !error && <CardSkeletons count={3} />}
          </div>
          {ready && !lawyers.length && (
            <p className="demo-note">
              Belum ada pengacara terverifikasi. Pengacara tampil di sini
              setelah lolos verifikasi Admin.
            </p>
          )}
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
              "Top Up Poin HiLaw",
              "Siapkan saldo dengan biaya yang jelas. 1 Poin = Rp1.000.",
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
              "Buka Chatbot dan ceritakan masalah Anda. HiLaw Assistant (Gemini AI) mengenali bidang hukumnya dan merekomendasikan pengacara terverifikasi yang sesuai.",
            ],
            [
              "Bagaimana cara membeli Poin HiLaw?",
              "Masuk sebagai Customer, buka Poin HiLaw, pilih paket, lalu bayar lewat Midtrans Sandbox (atau pembayaran simulasi bila Midtrans belum diaktifkan). 1 Poin = Rp1.000. Tidak ada uang asli yang ditagihkan pada tahap ini.",
            ],
            [
              "Bagaimana cara melakukan konsultasi?",
              "Pilih pengacara dan buka profilnya. Masuk sebagai Customer, lalu bayar dengan Poin. Setelah pengacara menerima dan memulai sesi, ruang chat terbuka untuk Anda berdua.",
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
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand">
            <Scale size={28} />
            HiLaw.
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
          <span>halo@hilaw.example</span>
          <span>Jakarta, Indonesia</span>
        </div>
        <div className="footer-note">
          <ShieldCheck size={25} />
          <p>
            Ruang untuk memahami.
            <br />
            Teman untuk melangkah.
          </p>
          <small>Prototipe tugas kuliah</small>
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
  const { ready, error } = useCoins();
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
            <legend>Rentang tarif (Poin)</legend>
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
                aria-label="Tarif minimum dalam Poin"
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
                aria-label="Tarif maksimum dalam Poin"
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
              {selectedMax.toLocaleString("id-ID")} Poin / 30 menit
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
              {ready ? (
                <>
                  <strong>{results.length}</strong> pengacara ditemukan
                </>
              ) : error ? (
                "Daftar pengacara belum dapat dimuat."
              ) : (
                "Memuat pengacara…"
              )}
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
          {!ready ? (
            !error && (
              <div className="directory-cards" aria-busy="true">
                <CardSkeletons count={4} />
              </div>
            )
          ) : results.length ? (
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
        </div>
      </div>
    </>
  );
}

interface Review {
  id: string;
  name: string;
  rating: number;
  body: string | null;
}

export function LawyerDetail({ lawyer: l }: { lawyer: ManagedLawyer }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  useEffect(() => {
    let active = true;
    api<Review[]>("/lawyers/" + l.id + "/reviews", {}, false)
      .then((items) => active && setReviews(items))
      .catch(() => active && setReviews([]));
    return () => {
      active = false;
    };
  }, [l.id]);

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
                Terverifikasi {l.organization}
              </p>
              <p className="meta">
                <BriefcaseBusiness size={16} />
                {l.experience} tahun pengalaman <Star size={16} />
                {l.reviews ? `${l.rating} (${l.reviews} ulasan)` : "Belum ada ulasan"}
              </p>
            </div>
          </article>
          <section className="detail-section">
            <h2>Mengenal pengacara</h2>
            <p>{l.bio}</p>
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
            {!!l.reviews && (
              <p className="rating-large">
                <Star /> {l.rating} <small>/ 5 · {l.reviews} ulasan</small>
              </p>
            )}
            {reviews === null ? (
              <p className="loading" role="status">
                Memuat ulasan…
              </p>
            ) : reviews.length ? (
              reviews.map((r) => (
                <div className="review" key={r.id}>
                  <strong>{r.name}</strong>
                  <span>{"★".repeat(r.rating)}</span>
                  {r.body && <p>{r.body}</p>}
                </div>
              ))
            ) : (
              <p>Belum ada ulasan. Ulasan muncul setelah konsultasi selesai.</p>
            )}
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
            {l.rate} <span>Poin HiLaw</span>
          </div>
          <p>Rp{(l.rate * 1000).toLocaleString("id-ID")} / 30 menit</p>
          <hr />
          <p className="meta">
            <MessageCircle size={18} />
            Konsultasi chat · sesi berakhir otomatis
          </p>
          {SESSION_PACKAGES.map((p) => (
            <p className="meta package-line" key={p.minutes}>
              <Clock size={18} />
              {p.name} {p.minutes} menit
              <strong>{packagePrice(l.rate, p.minutes)} Poin</strong>
            </p>
          ))}
          <p className="meta">
            <Coins size={18} />1 Poin = Rp1.000
          </p>
          <ConsultationBooking lawyer={l} />
        </aside>
      </div>
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
