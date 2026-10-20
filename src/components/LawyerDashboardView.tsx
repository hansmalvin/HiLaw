'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Coins,
  Users,
  ThumbsUp,
  Clock,
  FileText,
  Send,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  Video,
  PhoneCall,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useHiLaw } from '@/context/HiLawContext';

export default function LawyerDashboardView() {
  const {
    lawyers,
    lawyerBalance,
    sessions,
    activeSessionId,
    setActiveSessionId,
    setIsConsultationOpen,
    toggleLawyerAvailability,
    updateLawyerRates,
    submitLegalResume,
    withdrawLawyerTokens,
  } = useHiLaw();

  // Active Lawyer Profile (Adv. Raka Mahendra)
  const myProfile = lawyers.find((l) => l.id === 'law-01') || lawyers[0];
  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Rate Editor State
  const [chatRate, setChatRate] = useState(myProfile.tokenRateChat);
  const [callRate, setCallRate] = useState(myProfile.tokenRateCall);
  const [rateSaved, setRateSaved] = useState(false);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState(500);
  const [bankAccount, setBankAccount] = useState('BCA 5240-9918-21 a.n. Raka Mahendra');
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);

  // Legal Resume Form State
  const [issueAnalysis, setIssueAnalysis] = useState(
    currentSession?.legalSummary?.issueAnalysis ||
      'Berdasarkan bukti PO, BAST, dan Invoice yang telah melewati jatuh tempo 45 hari, pihak rekanan telah memenuhi unsur Wanprestasi (Cidera Janji).'
  );
  const [legalBasis, setLegalBasis] = useState(
    currentSession?.legalSummary?.legalBasis ||
      'Pasal 1238 & Pasal 1243 KUHPerdata tentang Wanprestasi serta Perma No. 4 Tahun 2019 tentang Gugatan Sederhana.'
  );
  const [actionText, setActionText] = useState(
    (
      currentSession?.legalSummary?.recommendedAction || [
        'Kirimkan Surat Somasi I dengan batas waktu pelunasan 7 hari kalender.',
        'Siapkan bundel bukti kontrak, PO, BAST, dan rincian tagihan.',
        'Ajukan Gugatan Sederhana ke Pengadilan Negeri jika somasi tidak diindahkan.',
      ]
    ).join('\n')
  );
  const [resumeSent, setResumeSent] = useState(false);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateLawyerRates(myProfile.id, Number(chatRate), Number(callRate));
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2500);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = withdrawLawyerTokens(Number(withdrawAmount), bankAccount);
    if (ok) {
      setWithdrawNotice(
        `Pencairan ${withdrawAmount} LawToken (Rp ${(
          withdrawAmount * 1000
        ).toLocaleString('id-ID')}) ke ${bankAccount} berhasil diproses!`
      );
      setTimeout(() => setWithdrawNotice(null), 4000);
    } else {
      setWithdrawNotice('Nominal pencairan melebihi saldo LawToken Anda.');
    }
  };

  const handleSendLegalResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;
    const actions = actionText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    submitLegalResume(currentSession.id, {
      issueAnalysis,
      legalBasis,
      recommendedAction: actions,
    });
    setResumeSent(true);
    setTimeout(() => setResumeSent(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner & Availability Toggle */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF2FF] text-[#3B5BDB] font-extrabold text-xl flex items-center justify-center border border-[#DBE4FF]">
            {myProfile.avatarUrl}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">
                {myProfile.fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6FCF5] text-[#0CA678]">
                <ShieldCheck className="w-3.5 h-3.5" /> {myProfile.licenseNumber}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Mitra Spesialis {myProfile.specialization} • {myProfile.university}
            </p>
          </div>
        </div>

        {/* Status Toggle (Online / Sibuk / Offline) */}
        <div className="flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-xl border border-[#E2E8F0]">
          <span className="text-xs font-bold text-[#64748B] px-2">Status Praktik:</span>
          {(
            [
              { id: 'ONLINE', label: '🟢 Online (Terima Sesi)' },
              { id: 'BUSY', label: '🟡 Istirahat / Sibuk' },
              { id: 'OFFLINE', label: '⚪ Offline' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => toggleLawyerAvailability(myProfile.id, st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                myProfile.availabilityStatus === st.id
                  ? 'bg-[#1E293B] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFF9DB]/60 border border-[#FCC419]/50 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#B45309]">
            <span>DOMPET PENGHASILAN</span>
            <Coins className="w-4 h-4 text-[#F59F00]" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#1E293B] mt-1">
            🪙 {lawyerBalance} Token
          </div>
          <p className="text-xs text-[#92400E] mt-0.5">
            Setara Rp {(lawyerBalance * 1000).toLocaleString('id-ID')} siap tarik
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>TOTAL SESI KONSULTASI</span>
            <Users className="w-4 h-4 text-[#3B5BDB]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-1">
            {myProfile.totalConsultations + sessions.length} Klien
          </div>
          <p className="text-xs text-[#0CA678] font-semibold mt-0.5">
            +{sessions.length} Sesi aktif hari ini
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>TINGKAT KEPUASAN KLIEN</span>
            <ThumbsUp className="w-4 h-4 text-[#0CA678]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-1">
            {myProfile.satisfactionRate}% Positif
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Rata-rata rating ★ 4.95 / 5.0
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>TARIF AKTIF SAAT INI</span>
            <Clock className="w-4 h-4 text-[#E64980]" />
          </div>
          <div className="text-lg font-extrabold font-mono text-[#1E293B] mt-1">
            Chat {myProfile.tokenRateChat}🪙 • Call {myProfile.tokenRateCall}🪙
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">Per sesi 30 menit + Resume</p>
        </div>
      </div>

      {/* Main Grid: Left (Incoming Queue + Withdrawal & Rates) & Right (Legal Resume Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Antrean Konsultasi Klien Masuk */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#1E293B]">
                  Antrean Konsultasi Masuk (Incoming Queue)
                </h2>
                <p className="text-xs text-[#64748B]">
                  Klik &quot;Buka Ruang Sesi&quot; untuk merespons chat/video call klien.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EDF2FF] text-[#3B5BDB]">
                {sessions.length} Sesi
              </span>
            </div>

            <div className="space-y-3">
              {sessions.map((ses) => (
                <div
                  key={ses.id}
                  className={`p-4 rounded-xl border transition ${
                    currentSession?.id === ses.id
                      ? 'border-[#3B5BDB] bg-[#EDF2FF]/40'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1E293B]">
                        {ses.clientName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-white border border-[#CBD5E1] text-[#3B5BDB]">
                        {ses.channel === 'CHAT' && (
                          <MessageSquare className="w-3 h-3" />
                        )}
                        {ses.channel === 'VOICE_CALL' && (
                          <PhoneCall className="w-3 h-3" />
                        )}
                        {ses.channel === 'VIDEO_CALL' && <Video className="w-3 h-3" />}
                        {ses.channel}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          ses.status === 'COMPLETED'
                            ? 'bg-[#E6FCF5] text-[#0CA678]'
                            : 'bg-[#FFF9DB] text-[#B45309]'
                        }`}
                      >
                        {ses.status}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0CA678]">
                      +🪙 {ses.tokensLocked} Token
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] mt-2 bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                    <strong>Pre-Chat Brief:</strong> {ses.briefDescription}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">{ses.startedAt}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSessionId(ses.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        Pilih untuk Legal Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSessionId(ses.id);
                          setIsConsultationOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#364FC7] text-white text-xs font-bold cursor-pointer"
                      >
                        Buka Ruang Sesi
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pencairan Penghasilan (Withdrawal) & Pengaturan Tarif */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarik Dana */}
            <form
              onSubmit={handleWithdraw}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#0CA678]" />
                <h3 className="text-sm font-extrabold text-[#1E293B]">
                  Tarik Penghasilan (Withdrawal)
                </h3>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Jumlah LawToken Dicairkan (Maks: {lawyerBalance})
                </label>
                <input
                  type="number"
                  min={50}
                  max={lawyerBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm font-mono text-[#1E293B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Rekening Tujuan Pencairan
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs text-[#1E293B]"
                />
              </div>
              {withdrawNotice && (
                <div className="text-xs font-semibold text-[#0CA678] bg-[#E6FCF5] p-2.5 rounded-xl">
                  {withdrawNotice}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-[#0CA678] hover:bg-[#099268] text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Cairkan Rp {(withdrawAmount * 1000).toLocaleString('id-ID')} ke Bank
              </button>
            </form>

            {/* Atur Tarif Token */}
            <form
              onSubmit={handleSaveRates}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#3B5BDB]" />
                <h3 className="text-sm font-extrabold text-[#1E293B]">
                  Manajemen Tarif Sesi (LawToken)
                </h3>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Tarif Live Chat (30 Menit)
                </label>
                <input
                  type="number"
                  min={20}
                  value={chatRate}
                  onChange={(e) => setChatRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm font-mono text-[#1E293B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Tarif Voice / Video Call (30 Menit)
                </label>
                <input
                  type="number"
                  min={30}
                  value={callRate}
                  onChange={(e) => setCallRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm font-mono text-[#1E293B]"
                />
              </div>
              {rateSaved && (
                <div className="text-xs font-semibold text-[#0CA678]">
                  ✓ Tarif diperbarui di direktori klien!
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-[#3B5BDB] hover:bg-[#364FC7] text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Simpan Perubahan Tarif
              </button>
            </form>
          </div>
        </div>

        {/* Right 5 Cols: Form Pembuatan Legal Resume */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSendLegalResume}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4 shadow-2xs"
          >
            <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDF2FF] text-[#3B5BDB] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#1E293B]">
                  Form Penyusunan Legal Resume
                </h2>
                <p className="text-xs text-[#64748B]">
                  Untuk Klien: <strong>{currentSession?.clientName}</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                1. Analisis Singkat Posisi Hukum Klien
              </label>
              <textarea
                rows={3}
                required
                value={issueAnalysis}
                onChange={(e) => setIssueAnalysis(e.target.value)}
                className="w-full rounded-xl border border-[#CBD5E1] p-3 text-xs text-[#1E293B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                2. Dasar Hukum / Pasal Undang-Undang Terkait
              </label>
              <textarea
                rows={2}
                required
                value={legalBasis}
                onChange={(e) => setLegalBasis(e.target.value)}
                className="w-full rounded-xl border border-[#CBD5E1] p-3 text-xs text-[#1E293B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                3. Rekomendasi Langkah Hukum (1 baris per poin)
              </label>
              <textarea
                rows={4}
                required
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                className="w-full rounded-xl border border-[#CBD5E1] p-3 text-xs text-[#1E293B]"
              />
            </div>

            {resumeSent && (
              <div className="bg-[#E6FCF5] border border-[#96F2D7] text-[#0CA678] p-3 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Legal Resume berhasil dikirim ke ruang konsultasi klien!
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#E64980] hover:bg-[#D6336C] text-white font-bold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Terbitkan & Kirim Legal Resume ke Klien
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
