'use client';

import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Video,
  Sparkles,
  Coins,
  Search,
  ShieldCheck,
  ThumbsUp,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Lock,
  PhoneCall,
  HelpCircle,
  X,
  GraduationCap,
} from 'lucide-react';
import { useHiLaw } from '@/context/HiLawContext';
import { SPECIALIZATIONS, LEGAL_TRIAGE_CASES } from '@/data/mockData';
import {
  LawyerProfile,
  LegalSpecialization,
  ConsultationChannel,
  LegalTriageCase,
} from '@/types/hilaw';

export default function ClientView() {
  const {
    lawyers,
    tokenBalance,
    openTopUpModal,
    startConsultation,
    setIsConsultationOpen,
    sessions,
    setActiveSessionId,
  } = useHiLaw();

  const [selectedCategory, setSelectedCategory] = useState<
    LegalSpecialization | 'ALL'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [showTriage, setShowTriage] = useState(true);
  const [activeTriage, setActiveTriage] = useState<LegalTriageCase | null>(null);

  // Booking / Pre-Chat Brief Modal State
  const [bookingLawyer, setBookingLawyer] = useState<LawyerProfile | null>(null);
  const [bookingChannel, setBookingChannel] =
    useState<ConsultationChannel>('CHAT');
  const [briefText, setBriefText] = useState(
    'Saya ingin berkonsultasi mengenai langkah hukum dan penyusunan somasi untuk kasus saya.'
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const verifiedLawyers = lawyers.filter(
    (l) => l.verificationStatus === 'VERIFIED'
  );

  const filteredLawyers = verifiedLawyers.filter((l) => {
    const matchesCategory =
      selectedCategory === 'ALL' || l.specialization === selectedCategory;
    const matchesOnline = !onlineOnly || l.isOnline;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.fullName.toLowerCase().includes(q) ||
      l.specialization.toLowerCase().includes(q) ||
      l.subSpecialties.some((s) => s.toLowerCase().includes(q));
    return matchesCategory && matchesOnline && matchesSearch;
  });

  const handleSelectTriage = (item: LegalTriageCase) => {
    setActiveTriage(item);
    setSelectedCategory(item.recommendedSpecialty);
  };

  const handleOpenBooking = (
    lawyer: LawyerProfile,
    channel: ConsultationChannel
  ) => {
    setBookingLawyer(lawyer);
    setBookingChannel(channel);
    setBookingError(null);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingLawyer) return;
    const res = startConsultation(
      bookingLawyer,
      bookingChannel,
      briefText,
      isAnonymous
    );
    if (!res.ok) {
      setBookingError(res.reason || 'Saldo tidak mencukupi.');
    } else {
      setBookingLawyer(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* 1. Halodoc-Inspired Hero Section with Pastel Legal Trust Palette */}
      <section className="rounded-3xl bg-gradient-to-br from-[#EDF2FF] via-[#F8FAFC] to-[#FFF0F6] border border-[#DBE4FF] p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DBE4FF] text-xs font-bold text-[#3B5BDB] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#0CA678]" />
              <span>Platform Konsultasi Hukum Spesialis #1 • Semudah Halodoc</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              Konsultasi Pengacara Spesialis dari Rumah,{' '}
              <span className="text-[#3B5BDB]">Harga Transparan</span> &{' '}
              <span className="text-[#E64980]">100% Rahasia</span>.
            </h1>

            <p className="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">
              Tak perlu bingung atau takut biaya mahal. Pilih advokat berlisensi{' '}
              <strong className="text-[#1E293B]">PERADI / KAI</strong> sesuai bidang
              masalah Anda, diskusi instan via{' '}
              <strong className="text-[#1E293B]">Chat, Telepon, atau Video Call</strong>,
              dan dapatkan <strong className="text-[#1E293B]">Legal Resume</strong> resmi
              mulai dari <span className="font-bold text-[#B45309]">40 LawToken</span>{' '}
              (Rp 40.000).
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pengacara atau kasus (misal: somasi hutang, PHK, kontrak, waris)..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#CBD5E1] text-sm text-[#1E293B] shadow-2xs focus:outline-none focus:border-[#3B5BDB]"
                />
              </div>
              <button
                type="button"
                onClick={() => setOnlineOnly(!onlineOnly)}
                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                  onlineOnly
                    ? 'bg-[#0CA678] text-white border-[#0CA678]'
                    : 'bg-white text-[#1E293B] border-[#CBD5E1] hover:bg-[#E6FCF5]'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    onlineOnly ? 'bg-white' : 'bg-[#0CA678]'
                  }`}
                />
                Online Sekarang
              </button>
            </div>
          </div>

          {/* 4 Halodoc-Style Quick Service Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOnlineOnly(true);
                document
                  .getElementById('lawyer-directory')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white hover:border-[#E64980] border border-[#E2E8F0] p-4 rounded-2xl text-left shadow-2xs hover:shadow-md transition group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FFF0F6] text-[#E64980] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-sm text-[#1E293B]">
                Chat Pengacara
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Respon cepat &lt; 2 menit dari advokat Online
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSessionId(sessions[0]?.id || 'ses-active-01');
                setIsConsultationOpen(true);
              }}
              className="bg-white hover:border-[#3B5BDB] border border-[#E2E8F0] p-4 rounded-2xl text-left shadow-2xs hover:shadow-md transition group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#EDF2FF] text-[#3B5BDB] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Video className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-sm text-[#1E293B]">
                Video & Voice Call
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Bedah dokumen kontrak & tatap muka daring
              </p>
            </button>

            <button
              type="button"
              onClick={() => setShowTriage(!showTriage)}
              className="bg-white hover:border-[#0CA678] border border-[#E2E8F0] p-4 rounded-2xl text-left shadow-2xs hover:shadow-md transition group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#E6FCF5] text-[#0CA678] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-sm text-[#1E293B]">
                Cek Spesialis (Triage)
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Bingung pilih bidang hukum? Cek di sini
              </p>
            </button>

            <button
              type="button"
              onClick={() => openTopUpModal()}
              className="bg-white hover:border-[#F59F00] border border-[#E2E8F0] p-4 rounded-2xl text-left shadow-2xs hover:shadow-md transition group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FFF9DB] text-[#F59F00] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Coins className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-sm text-[#1E293B]">
                Top-Up LawToken
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Isi saldo via QRIS, VA & GoPay (Midtrans)
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Interactive Legal Triage Wizard ("Bantu Pilih Spesialis") */}
      {showTriage && (
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EDF2FF] text-[#3B5BDB] flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B]">
                  Interactive Legal Triage — Apa Masalah yang Sedang Anda Hadapi?
                </h2>
                <p className="text-xs text-[#64748B]">
                  Pilih situasi yang paling mendekati keluhan Anda, sistem otomatis
                  mencocokkan spesialis pengacara yang tepat.
                </p>
              </div>
            </div>
            {activeTriage && (
              <button
                type="button"
                onClick={() => {
                  setActiveTriage(null);
                  setSelectedCategory('ALL');
                }}
                className="text-xs font-bold text-[#E64980] hover:underline cursor-pointer"
              >
                Reset Pilihan Triage
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {LEGAL_TRIAGE_CASES.map((item) => {
              const isSelected = activeTriage?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTriage(item)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#3B5BDB] bg-[#EDF2FF] ring-2 ring-[#3B5BDB]/20'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC]/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-[#3B5BDB] border border-[#DBE4FF]">
                        → {item.recommendedSpecialty}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.urgency === 'Mendesak'
                            ? 'bg-[#FFF0F6] text-[#E64980]'
                            : 'bg-[#E6FCF5] text-[#0CA678]'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-[#1E293B]">
                      {item.symptomTitle}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Contoh: {item.symptomExample}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {activeTriage && (
            <div className="bg-[#E6FCF5] border border-[#96F2D7] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-extrabold text-[#0CA678] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Rekomendasi Spesialis: {activeTriage.recommendedSpecialty}
                </div>
                <p className="text-xs text-[#1E293B]">
                  <strong>Tips Awal sebelum Konsultasi:</strong>{' '}
                  {activeTriage.preliminaryTip}
                </p>
              </div>
              <span className="text-xs font-bold text-[#0CA678] shrink-0">
                Menampilkan {filteredLawyers.length} Advokat Sesuai ↓
              </span>
            </div>
          )}
        </section>
      )}

      {/* 3. Specialist Category Filter Pills & Lawyer Directory */}
      <section id="lawyer-directory" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">
              Direktori Spesialis Pengacara Terverifikasi
            </h2>
            <p className="text-xs text-[#64748B]">
              Seluruh mitra advokat telah melalui kurasi berlapis KTA PERADI/KAI &
              Berita Acara Sumpah Pengadilan Tinggi.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#64748B]">
            Menampilkan{' '}
            <strong className="text-[#1E293B]">{filteredLawyers.length}</strong>{' '}
            Advokat Spesialis
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 border transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#3B5BDB] text-white border-[#3B5BDB]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#1E293B]'
            }`}
          >
            Semua Spesialis ({verifiedLawyers.length})
          </button>
          {SPECIALIZATIONS.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 border transition cursor-pointer ${
                  active
                    ? 'bg-[#3B5BDB] text-white border-[#3B5BDB]'
                    : 'bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#EDF2FF]'
                }`}
              >
                {cat.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Halodoc-Style Lawyer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#3B5BDB]/50 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              {/* Top Section: Avatar + Info */}
              <div className="flex items-start gap-4">
                {/* Avatar with Online Indicator */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#EDF2FF] text-[#3B5BDB] font-extrabold text-lg flex items-center justify-center border border-[#DBE4FF]">
                    {lawyer.avatarUrl}
                  </div>
                  <span
                    title={lawyer.isOnline ? 'Online Sekarang' : 'Sedang Sibuk/Offline'}
                    className={`w-4 h-4 rounded-full border-2 border-white absolute -bottom-1 -right-1 ${
                      lawyer.isOnline ? 'bg-[#0CA678]' : 'bg-[#F59F00]'
                    }`}
                  />
                </div>

                {/* Middle Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EDF2FF] text-[#3B5BDB] text-[11px] font-bold">
                      {lawyer.specialization}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E6FCF5] text-[#0CA678] text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" /> {lawyer.organization}{' '}
                      Terverifikasi
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#1E293B] mt-1 truncate">
                    {lawyer.fullName}
                  </h3>

                  <div className="flex items-center gap-1 text-[11px] text-[#64748B] mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#3B5BDB] shrink-0" />
                    <span className="truncate">{lawyer.university}</span>
                  </div>

                  {/* Meta Badges (Experience, Satisfaction, License) */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                    <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg font-semibold text-[#1E293B]">
                      <Briefcase className="w-3.5 h-3.5 text-[#3B5BDB]" />
                      {lawyer.experienceYears} Tahun
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#FFF9DB] border border-[#FCC419]/40 px-2.5 py-1 rounded-lg font-bold text-[#B45309]">
                      <ThumbsUp className="w-3.5 h-3.5 text-[#F59F00]" />
                      {lawyer.satisfactionRate}% ({lawyer.totalConsultations} Sesi)
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      KTA: {lawyer.licenseNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio & SubSpecialties */}
              <div className="space-y-2">
                <p className="text-xs text-[#64748B] leading-relaxed">{lawyer.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {lawyer.subSpecialties.map((sub) => (
                    <span
                      key={sub}
                      className="text-[11px] bg-[#F1F5F9] text-[#475569] px-2.5 py-0.5 rounded-md font-medium"
                    >
                      #{sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Transparent Token Rate & Halodoc CTA Buttons */}
              <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-[#64748B]">
                    Tarif Konsultasi (30 Menit)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold font-mono text-[#1E293B]">
                      🪙 {lawyer.tokenRateChat} LawToken
                    </span>
                    <span className="text-xs text-[#64748B]">
                      (Rp {(lawyer.tokenRateChat * 1000).toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(lawyer, 'VIDEO_CALL')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#3B5BDB] text-[#3B5BDB] hover:bg-[#EDF2FF] text-xs font-bold transition cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Call / Video ({lawyer.tokenRateCall}🪙)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(lawyer, 'CHAT')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E64980] hover:bg-[#D6336C] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    Chat Sekarang
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-Chat Brief Modal before starting consultation */}
      {bookingLawyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden">
            <div className="bg-[#EDF2FF] px-5 py-4 border-b border-[#DBE4FF] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B5BDB]">
                  Pre-Consultation Brief • Halodoc Legal Flow
                </span>
                <h3 className="text-base font-extrabold text-[#1E293B]">
                  Mulai Konsultasi dengan {bookingLawyer.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingLawyer(null)}
                className="p-1 rounded-lg hover:bg-white text-[#64748B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-5 space-y-4">
              {/* Pilih Channel Sesi */}
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">
                  Pilih Metode Konsultasi (30 Menit + Legal Resume PDF)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'CHAT',
                        label: 'Live Chat',
                        cost: bookingLawyer.tokenRateChat,
                      },
                      {
                        id: 'VOICE_CALL',
                        label: 'Voice Call',
                        cost: bookingLawyer.tokenRateCall,
                      },
                      {
                        id: 'VIDEO_CALL',
                        label: 'Video Call',
                        cost: bookingLawyer.tokenRateCall,
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBookingChannel(opt.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        bookingChannel === opt.id
                          ? 'border-[#3B5BDB] bg-[#EDF2FF] text-[#3B5BDB] font-bold'
                          : 'border-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[11px] font-mono text-[#B45309] mt-0.5">
                        🪙 {opt.cost} Token
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kronologi Singkat */}
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1.5">
                  Ringkasan Masalah / Kronologi Singkat
                </label>
                <textarea
                  rows={3}
                  required
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-xs sm:text-sm text-[#1E293B] focus:outline-none focus:border-[#3B5BDB]"
                  placeholder="Ceritakan singkat duduk perkara agar waktu 30 menit Anda langsung fokus pada solusi hukum..."
                />
              </div>

              {/* Mode Anonim Toggle */}
              <label className="flex items-start gap-2.5 bg-[#E6FCF5]/60 border border-[#96F2D7] p-3 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#0CA678] flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Aktifkan Mode Anonim (Samarkan
                    Nama Saya)
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    Nama asli Anda diganti dengan inisial enkripsi selama sesi
                    berlangsung.
                  </p>
                </div>
              </label>

              {bookingError && (
                <div className="bg-[#FFF0F6] border border-[#FFDEEB] text-[#E64980] p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
                  <span>{bookingError}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingLawyer(null);
                      openTopUpModal();
                    }}
                    className="bg-[#E64980] text-white px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer"
                  >
                    Top-Up Sekarang
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <div className="text-xs text-[#64748B]">
                  Saldo Anda:{' '}
                  <strong className="text-[#1E293B] font-mono">
                    🪙 {tokenBalance} Token
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingLawyer(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-[#E64980] hover:bg-[#D6336C] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                  >
                    Potong{' '}
                    {bookingChannel === 'CHAT'
                      ? bookingLawyer.tokenRateChat
                      : bookingLawyer.tokenRateCall}{' '}
                    Token & Mulai Sesi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
