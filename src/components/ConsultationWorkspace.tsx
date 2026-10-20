'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  PhoneCall,
  Video,
  Clock,
  ShieldCheck,
  Send,
  Paperclip,
  FileText,
  Download,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useHiLaw } from '@/context/HiLawContext';
import { ConsultationChannel } from '@/types/hilaw';

export default function ConsultationWorkspace() {
  const {
    sessions,
    messages,
    activeSessionId,
    setActiveSessionId,
    setIsConsultationOpen,
    sendMessage,
    switchSessionChannel,
    extendSessionDuration,
    role,
  } = useHiLaw();

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const [chatInput, setChatInput] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | undefined>(
    undefined
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(
    (currentSession?.durationMinutes || 30) * 60 - 15
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Sync timer when session duration changes
  useEffect(() => {
    if (currentSession) {
      setSecondsLeft(currentSession.durationMinutes * 60 - 15);
    }
  }, [currentSession?.id, currentSession?.durationMinutes]);

  // Countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentSession) return null;

  const sessionMessages = messages.filter(
    (m) => m.consultationId === currentSession.id
  );

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTimer = `${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0'
  )}`;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(
      currentSession.id,
      chatInput,
      role === 'LAWYER' ? 'LAWYER' : 'CLIENT',
      attachmentName
    );
    setChatInput('');
    setAttachmentName(undefined);
  };

  const handleChannelChange = (ch: ConsultationChannel) => {
    switchSessionChannel(currentSession.id, ch);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Top Bar Navigation & Session Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsConsultationOpen(false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-xs font-bold text-[#1E293B] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B]">
                Ruang Konsultasi Hukum Terenkripsi
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E6FCF5] text-[#0CA678]">
                <Lock className="w-3 h-3" /> End-to-End Confidential
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              {currentSession.lawyerName} ({currentSession.lawyerLicense}) •{' '}
              {currentSession.lawyerSpecialty}
            </p>
          </div>
        </div>

        {/* Pilih Sesi & Timer */}
        <div className="flex flex-wrap items-center gap-2.5">
          {sessions.length > 1 && (
            <select
              aria-label="Pilih Sesi Konsultasi"
              value={currentSession.id}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#1E293B]"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.lawyerName} ({s.channel})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 bg-[#FFF0F6] border border-[#FFDEEB] px-3 py-1.5 rounded-xl">
            <Clock className="w-4 h-4 text-[#E64980]" />
            <span className="font-mono font-extrabold text-sm text-[#E64980]">
              {formattedTimer}
            </span>
          </div>

          <button
            type="button"
            onClick={() => extendSessionDuration(currentSession.id)}
            className="inline-flex items-center gap-1 bg-[#FFF9DB] hover:bg-[#FCC419]/30 text-[#B45309] border border-[#FCC419] px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            +15 Mnt (25 Token)
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Chat / Voice / Video Call) & Right (Legal Resume) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multimodal Communication (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col overflow-hidden print:hidden">
          {/* Channel Mode Switcher (Chat | Telepon | Video Call) */}
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-xl bg-white p-1 border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => handleChannelChange('CHAT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentSession.channel === 'CHAT'
                    ? 'bg-[#3B5BDB] text-white'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Live Chat
              </button>
              <button
                type="button"
                onClick={() => handleChannelChange('VOICE_CALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentSession.channel === 'VOICE_CALL'
                    ? 'bg-[#3B5BDB] text-white'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Telepon (Voice Call)
              </button>
              <button
                type="button"
                onClick={() => handleChannelChange('VIDEO_CALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentSession.channel === 'VIDEO_CALL'
                    ? 'bg-[#E64980] text-white'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Video Call
              </button>
            </div>

            <span className="text-[11px] font-medium text-[#64748B]">
              Biaya Sesi Terkunci:{' '}
              <strong className="text-[#B45309] font-mono">
                🪙 {currentSession.tokensLocked} Token
              </strong>
            </span>
          </div>

          {/* Voice / Video Call Interactive Stage (When VOICE_CALL or VIDEO_CALL is active) */}
          {currentSession.channel !== 'CHAT' && (
            <div className="bg-[#1E293B] text-white p-5 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Lawyer Stream Card */}
                <div className="aspect-video rounded-xl bg-[#0F172A] border border-white/10 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-[#3B5BDB] text-white font-extrabold text-xl flex items-center justify-center ring-4 ring-[#0CA678]/40">
                    {currentSession.lawyerName.slice(5, 7).toUpperCase()}
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-center">
                    {currentSession.lawyerName}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#0CA678] animate-pulse" />
                    {currentSession.channel === 'VIDEO_CALL'
                      ? 'HD Video Call Aktif'
                      : 'Suara Jernih Terenkripsi'}
                  </div>
                </div>

                {/* Client / Screen Share Stream Card */}
                <div className="aspect-video rounded-xl bg-[#0F172A] border border-white/10 p-4 flex flex-col items-center justify-center relative">
                  {isScreenSharing ? (
                    <div className="text-center space-y-1">
                      <MonitorUp className="w-8 h-8 text-[#FCC419] mx-auto" />
                      <div className="text-xs font-bold text-[#FCC419]">
                        Screen Share Dokumen Kontrak Aktif
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">
                        Menampilkan: Draft_Perjanjian_dan_BAST.pdf
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-[#E64980] text-white font-bold text-base flex items-center justify-center">
                        {currentSession.isAnonymous ? 'ANON' : 'BS'}
                      </div>
                      <div className="mt-2 text-xs font-bold">
                        {currentSession.clientName} (Anda)
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {isCamOff ? 'Kamera Dimatikan' : 'Kamera Aktif'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Call Controls Bar */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isMuted
                      ? 'bg-[#E03131] text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? 'Unmute Mikrofon' : 'Mute Mikrofon'}
                </button>

                {currentSession.channel === 'VIDEO_CALL' && (
                  <button
                    type="button"
                    onClick={() => setIsCamOff(!isCamOff)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isCamOff
                        ? 'bg-[#E03131] text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <VideoOff className="w-4 h-4" />
                    {isCamOff ? 'Nyalakan Kamera' : 'Matikan Kamera'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isScreenSharing
                      ? 'bg-[#F59F00] text-[#1E293B]'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <MonitorUp className="w-4 h-4" />
                  {isScreenSharing ? 'Hentikan Share Dokumen' : 'Share Dokumen Kontrak'}
                </button>
              </div>
            </div>
          )}

          {/* Pre-Chat Brief Banner */}
          <div className="bg-[#EDF2FF]/60 border-b border-[#DBE4FF] px-4 py-2.5 text-xs">
            <span className="font-bold text-[#3B5BDB]">Kronologi Awal (Pre-Chat Brief): </span>
            <span className="text-[#1E293B]">{currentSession.briefDescription}</span>
          </div>

          {/* Chat Messages Stream */}
          <div className="p-4 space-y-3 h-[340px] overflow-y-auto bg-[#F8FAFC]">
            {sessionMessages.map((msg) => {
              if (msg.senderRole === 'SYSTEM') {
                return (
                  <div
                    key={msg.id}
                    className="mx-auto max-w-md text-center bg-[#E6FCF5] border border-[#96F2D7] text-[#0CA678] px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                  >
                    {msg.content}
                  </div>
                );
              }
              const isMe =
                (role === 'LAWYER' && msg.senderRole === 'LAWYER') ||
                (role !== 'LAWYER' && msg.senderRole === 'CLIENT');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-[#64748B] mb-1 px-1">
                    {msg.senderName} • {msg.sentAt}
                  </div>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#3B5BDB] text-white rounded-br-xs'
                        : 'bg-white border border-[#E2E8F0] text-[#1E293B] rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <p>{msg.content}</p>
                    {msg.attachmentUrl && (
                      <div
                        className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          isMe
                            ? 'bg-white/15 text-white'
                            : 'bg-[#EDF2FF] text-[#3B5BDB]'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {msg.attachmentUrl}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-[#E2E8F0] space-y-2"
          >
            {attachmentName && (
              <div className="flex items-center justify-between bg-[#EDF2FF] text-[#3B5BDB] px-3 py-1 rounded-lg text-xs font-semibold">
                <span>📎 Lampiran siap dikirim: {attachmentName}</span>
                <button
                  type="button"
                  onClick={() => setAttachmentName(undefined)}
                  className="text-[#E03131] font-bold cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setAttachmentName('Bukti_Perjanjian_dan_Mutasi_2026.pdf')
                }
                title="Simulasikan Unggah Bukti PDF/Foto"
                className="p-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] transition cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  role === 'LAWYER'
                    ? 'Ketik saran hukum untuk klien...'
                    : 'Tulis pertanyaan hukum atau kronologi tambahan...'
                }
                className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#3B5BDB]"
              />
              <button
                type="submit"
                className="bg-[#E64980] hover:bg-[#D6336C] text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Kirim
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Legal Resume Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EDF2FF] text-[#3B5BDB] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E6FCF5] text-[#0CA678]">
                    Dokumen Resmi HiLaw
                  </span>
                  <h3 className="text-base font-extrabold text-[#1E293B] mt-0.5">
                    Legal Resume (Ringkasan Advokat)
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B5BDB] hover:bg-[#364FC7] text-white text-xs font-bold transition cursor-pointer print:hidden"
              >
                <Download className="w-3.5 h-3.5" />
                Cetak / PDF
              </button>
            </div>

            {/* Metadata Kartu Resep Hukum */}
            <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Advokat Pemeriksa:</span>
                <span className="font-bold text-[#1E293B]">
                  {currentSession.lawyerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">No. Lisensi Advokat:</span>
                <span className="font-mono font-semibold text-[#0CA678]">
                  {currentSession.lawyerLicense}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Klien:</span>
                <span className="font-semibold text-[#1E293B]">
                  {currentSession.clientName}
                </span>
              </div>
            </div>

            {currentSession.legalSummary ? (
              <div className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3B5BDB] mb-1">
                    1. Analisis Posisi Hukum (Legal Standing)
                  </div>
                  <p className="text-[#1E293B] bg-[#EDF2FF]/50 p-3 rounded-xl border border-[#DBE4FF] leading-relaxed">
                    {currentSession.legalSummary.issueAnalysis}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3B5BDB] mb-1">
                    2. Dasar Hukum & Pasal Terkait
                  </div>
                  <p className="text-[#1E293B] bg-[#FFF9DB]/50 p-3 rounded-xl border border-[#FCC419]/40 font-medium leading-relaxed">
                    {currentSession.legalSummary.legalBasis}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0CA678] mb-1.5">
                    3. Rekomendasi Langkah Hukum Selanjutnya
                  </div>
                  <ul className="space-y-2">
                    {currentSession.legalSummary.recommendedAction.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-[#E6FCF5]/50 border border-[#96F2D7] p-2.5 rounded-xl text-xs text-[#1E293B]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#0CA678] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#64748B]">
                Advokat sedang menyusun ringkasan hukum untuk sesi ini...
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="inline-flex items-center gap-1 text-[#0CA678] font-semibold">
              <ShieldCheck className="w-4 h-4" /> Diverifikasi Mitra Advokat HiLaw
            </span>
            <span className="font-mono">ID: {currentSession.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
