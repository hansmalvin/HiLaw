'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  LawyerProfile,
  TokenPackage,
  TokenTransaction,
  ConsultationSession,
  ConsultationMessage,
  ConsultationChannel,
  PaymentMethod,
  LegalSummary,
} from '@/types/hilaw';
import {
  MOCK_LAWYERS,
  MOCK_TOKEN_PACKAGES,
  MOCK_TRANSACTIONS,
  MOCK_SESSIONS,
  MOCK_MESSAGES,
} from '@/data/mockData';

interface HiLawContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  tokenBalance: number;
  lawyerBalance: number;
  lawyers: LawyerProfile[];
  packages: TokenPackage[];
  transactions: TokenTransaction[];
  sessions: ConsultationSession[];
  messages: ConsultationMessage[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  isConsultationOpen: boolean;
  setIsConsultationOpen: (open: boolean) => void;
  isTopUpOpen: boolean;
  openTopUpModal: (pkg?: TokenPackage) => void;
  closeTopUpModal: () => void;
  selectedPackage: TokenPackage | null;
  setSelectedPackage: (pkg: TokenPackage | null) => void;
  // Actions
  processMidtransTopUp: (
    pkg: TokenPackage,
    method: PaymentMethod,
    status: 'SETTLEMENT' | 'PENDING'
  ) => void;
  settlePendingTransaction: (txId: string) => void;
  startConsultation: (
    lawyer: LawyerProfile,
    channel: ConsultationChannel,
    brief: string,
    isAnonymous: boolean
  ) => { ok: boolean; reason?: string; sessionId?: string };
  sendMessage: (
    consultationId: string,
    content: string,
    senderRole: 'CLIENT' | 'LAWYER',
    attachmentUrl?: string
  ) => void;
  switchSessionChannel: (consultationId: string, channel: ConsultationChannel) => void;
  extendSessionDuration: (consultationId: string) => boolean;
  toggleLawyerAvailability: (
    lawyerId: string,
    status: 'ONLINE' | 'BUSY' | 'OFFLINE'
  ) => void;
  updateLawyerRates: (lawyerId: string, chatRate: number, callRate: number) => void;
  submitLegalResume: (consultationId: string, summary: LegalSummary) => void;
  withdrawLawyerTokens: (tokenAmount: number, bankInfo: string) => boolean;
  verifyLawyerApplication: (
    lawyerId: string,
    decision: 'VERIFIED' | 'REJECTED'
  ) => void;
  addTokenPackage: (pkg: Omit<TokenPackage, 'id'>) => void;
  resetDemoState: () => void;
}

const STORAGE_KEY = 'hilaw_prototype_state_v1';

const HiLawContext = createContext<HiLawContextType | undefined>(undefined);

export function HiLawProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [tokenBalance, setTokenBalance] = useState<number>(120);
  const [lawyerBalance, setLawyerBalance] = useState<number>(840);
  const [lawyers, setLawyers] = useState<LawyerProfile[]>(MOCK_LAWYERS);
  const [packages, setPackages] = useState<TokenPackage[]>(MOCK_TOKEN_PACKAGES);
  const [transactions, setTransactions] = useState<TokenTransaction[]>(MOCK_TRANSACTIONS);
  const [sessions, setSessions] = useState<ConsultationSession[]>(MOCK_SESSIONS);
  const [messages, setMessages] = useState<ConsultationMessage[]>(MOCK_MESSAGES);
  const [activeSessionId, setActiveSessionId] = useState<string>('ses-active-01');
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(
    MOCK_TOKEN_PACKAGES[1]
  );
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setRole(parsed.role);
        if (typeof parsed.tokenBalance === 'number') setTokenBalance(parsed.tokenBalance);
        if (typeof parsed.lawyerBalance === 'number') setLawyerBalance(parsed.lawyerBalance);
        if (Array.isArray(parsed.lawyers)) setLawyers(parsed.lawyers);
        if (Array.isArray(parsed.packages)) setPackages(parsed.packages);
        if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
        if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (parsed.activeSessionId) setActiveSessionId(parsed.activeSessionId);
      }
    } catch {
      // shortcut: ignore corrupted localStorage in prototype, fallback to MOCK_* defaults
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          role,
          tokenBalance,
          lawyerBalance,
          lawyers,
          packages,
          transactions,
          sessions,
          messages,
          activeSessionId,
        })
      );
    } catch {
      // ignore quota error
    }
  }, [
    hydrated,
    role,
    tokenBalance,
    lawyerBalance,
    lawyers,
    packages,
    transactions,
    sessions,
    messages,
    activeSessionId,
  ]);

  const openTopUpModal = (pkg?: TokenPackage) => {
    if (pkg) setSelectedPackage(pkg);
    else if (!selectedPackage && packages.length > 0) setSelectedPackage(packages[1] || packages[0]);
    setIsTopUpOpen(true);
  };

  const closeTopUpModal = () => setIsTopUpOpen(false);

  const processMidtransTopUp = (
    pkg: TokenPackage,
    method: PaymentMethod,
    status: 'SETTLEMENT' | 'PENDING'
  ) => {
    const totalCredited = pkg.tokenAmount + pkg.bonusTokens;
    const now = new Date();
    const orderId = `HILAW-ORDER-20261020-${Math.floor(100 + Math.random() * 900)}`;
    const timeStr = `2026-10-20 ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} WIB`;

    const newTx: TokenTransaction = {
      id: `tx-${Date.now()}`,
      userId: 'usr-client-01',
      userName: 'Budi Santoso',
      packageId: pkg.id,
      txType: 'TOPUP_MIDTRANS',
      tokenDelta: totalCredited,
      amountIdr: pkg.priceIdr,
      midtransOrderId: orderId,
      paymentMethod: method,
      paymentStatus: status,
      createdAt: timeStr,
    };

    setTransactions((prev) => [newTx, ...prev]);
    if (status === 'SETTLEMENT') {
      setTokenBalance((prev) => prev + totalCredited);
    }
  };

  const settlePendingTransaction = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId && tx.paymentStatus === 'PENDING') {
          if (tx.userId === 'usr-client-01') {
            setTokenBalance((bal) => bal + tx.tokenDelta);
          }
          return { ...tx, paymentStatus: 'SETTLEMENT' };
        }
        return tx;
      })
    );
  };

  const startConsultation = (
    lawyer: LawyerProfile,
    channel: ConsultationChannel,
    brief: string,
    isAnonymous: boolean
  ) => {
    const cost = channel === 'CHAT' ? lawyer.tokenRateChat : lawyer.tokenRateCall;
    if (tokenBalance < cost) {
      return {
        ok: false,
        reason: `Saldo LawToken tidak mencukupi (Butuh ${cost} Token, Saldo Anda ${tokenBalance} Token).`,
      };
    }

    const sessionId = `ses-${Date.now()}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newSession: ConsultationSession = {
      id: sessionId,
      clientId: 'usr-client-01',
      clientName: isAnonymous ? 'Klien Anonim (#BS-Privasi)' : 'Budi Santoso',
      isAnonymous,
      lawyerId: lawyer.id,
      lawyerName: lawyer.fullName,
      lawyerSpecialty: lawyer.specialization,
      lawyerLicense: lawyer.licenseNumber,
      channel,
      caseCategory: lawyer.specialization,
      briefDescription: brief,
      tokensLocked: cost,
      durationMinutes: 30,
      status: 'ACTIVE',
      legalSummary: {
        issueAnalysis: `Klien berkonsultasi terkait ${lawyer.specialization}: "${brief}". Berdasarkan telaah awal dokumen & kronologi, klien memiliki kedudukan hukum untuk menempuh langkah upaya hukum preventif maupun represif.`,
        legalBasis:
          'Kitab Undang-Undang Hukum Perdata (KUHPerdata) / UU No. 18 Tahun 2003 tentang Advokat / Regulasi Spesialis Terkait.',
        recommendedAction: [
          'Kumpulkan seluruh bukti tertulis (dokumen perjanjian, bukti transfer, dan rekaman korespondensi).',
          'Susun teguran tertulis (Somasi) atau jadwal mediasi resmi bersama pihak terkait.',
          'Gunakan draf rekomendasi dari sesi ini sebagai acuan langkah hukum berikutnya.',
        ],
      },
      startedAt: `Hari ini, ${timeStr} WIB`,
    };

    const sysMsg: ConsultationMessage = {
      id: `msg-sys-${Date.now()}`,
      consultationId: sessionId,
      senderId: 'SYSTEM',
      senderName: 'Sistem Keamanan HiLaw',
      senderRole: 'SYSTEM',
      content: `Sesi ${channel.replace('_', ' ')} dimulai (${cost} LawToken). ${
        isAnonymous
          ? 'Mode Anonim Aktif: Identitas asli Anda disembunyikan.'
          : 'Dilindungi Kode Etik Kerahasiaan Advokat.'
      }`,
      sentAt: timeStr,
    };

    const clientInitMsg: ConsultationMessage = {
      id: `msg-cli-${Date.now() + 1}`,
      consultationId: sessionId,
      senderId: 'usr-client-01',
      senderName: newSession.clientName,
      senderRole: 'CLIENT',
      content: brief,
      sentAt: timeStr,
    };

    const lawyerGreeting: ConsultationMessage = {
      id: `msg-law-${Date.now() + 2}`,
      consultationId: sessionId,
      senderId: lawyer.id,
      senderName: lawyer.fullName,
      senderRole: 'LAWYER',
      content: `Halo ${newSession.clientName}, saya ${lawyer.fullName} (Lisensi ${lawyer.licenseNumber}). Saya telah membaca Pre-Chat Brief Anda. Mari kita bahas langkah hukum terbaik untuk masalah ini.`,
      sentAt: timeStr,
    };

    const debitTx: TokenTransaction = {
      id: `tx-debit-${Date.now()}`,
      userId: 'usr-client-01',
      userName: 'Budi Santoso',
      txType: 'CONSULTATION_DEBIT',
      tokenDelta: -cost,
      amountIdr: cost * 1000,
      midtransOrderId: `HILAW-SES-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentStatus: 'SETTLEMENT',
      createdAt: `2026-10-20 ${timeStr} WIB`,
    };

    setTokenBalance((prev) => prev - cost);
    setLawyerBalance((prev) => prev + cost);
    setTransactions((prev) => [debitTx, ...prev]);
    setSessions((prev) => [newSession, ...prev]);
    setMessages((prev) => [...prev, sysMsg, clientInitMsg, lawyerGreeting]);
    setActiveSessionId(sessionId);
    setIsConsultationOpen(true);

    return { ok: true, sessionId };
  };

  const sendMessage = (
    consultationId: string,
    content: string,
    senderRole: 'CLIENT' | 'LAWYER',
    attachmentUrl?: string
  ) => {
    const session = sessions.find((s) => s.id === consultationId);
    if (!session || !content.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMsg: ConsultationMessage = {
      id: `msg-${Date.now()}`,
      consultationId,
      senderId: senderRole === 'CLIENT' ? session.clientId : session.lawyerId,
      senderName: senderRole === 'CLIENT' ? session.clientName : session.lawyerName,
      senderRole,
      content,
      attachmentUrl,
      sentAt: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Simulated auto-response when client sends a message
    if (senderRole === 'CLIENT') {
      setTimeout(() => {
        const replyMsg: ConsultationMessage = {
          id: `msg-auto-${Date.now()}`,
          consultationId,
          senderId: session.lawyerId,
          senderName: session.lawyerName,
          senderRole: 'LAWYER',
          content:
            'Baik, poin tersebut sudah saya catat ke dalam analisis kasus Anda. Pastikan dokumen pendukung disimpan dengan baik, dan silakan cek pembaruan pada kartu Legal Resume di panel samping.',
          sentAt: timeStr,
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, 900);
    }
  };

  const switchSessionChannel = (
    consultationId: string,
    channel: ConsultationChannel
  ) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === consultationId ? { ...s, channel } : s))
    );
  };

  const extendSessionDuration = (consultationId: string) => {
    const extraTokens = 25;
    if (tokenBalance < extraTokens) {
      openTopUpModal();
      return false;
    }
    setTokenBalance((prev) => prev - extraTokens);
    setLawyerBalance((prev) => prev + extraTokens);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === consultationId
          ? {
              ...s,
              durationMinutes: s.durationMinutes + 15,
              tokensLocked: s.tokensLocked + extraTokens,
            }
          : s
      )
    );
    return true;
  };

  const toggleLawyerAvailability = (
    lawyerId: string,
    status: 'ONLINE' | 'BUSY' | 'OFFLINE'
  ) => {
    setLawyers((prev) =>
      prev.map((l) =>
        l.id === lawyerId
          ? { ...l, availabilityStatus: status, isOnline: status === 'ONLINE' }
          : l
      )
    );
  };

  const updateLawyerRates = (lawyerId: string, chatRate: number, callRate: number) => {
    setLawyers((prev) =>
      prev.map((l) =>
        l.id === lawyerId
          ? { ...l, tokenRateChat: chatRate, tokenRateCall: callRate }
          : l
      )
    );
  };

  const submitLegalResume = (consultationId: string, summary: LegalSummary) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === consultationId
          ? { ...s, legalSummary: summary, status: 'COMPLETED' }
          : s
      )
    );

    const sysNotice: ConsultationMessage = {
      id: `msg-resume-${Date.now()}`,
      consultationId,
      senderId: 'SYSTEM',
      senderName: 'Sistem HiLaw',
      senderRole: 'SYSTEM',
      content:
        'Advokat telah menerbitkan Legal Resume (Ringkasan Hukum Resmi). Anda dapat melihat dan mengunduh dokumen PDF di panel Legal Resume.',
      sentAt: timeStr,
    };
    setMessages((prev) => [...prev, sysNotice]);
  };

  const withdrawLawyerTokens = (tokenAmount: number, bankInfo: string) => {
    if (tokenAmount <= 0 || tokenAmount > lawyerBalance) return false;
    const now = new Date();
    const timeStr = `2026-10-20 ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} WIB`;

    setLawyerBalance((prev) => prev - tokenAmount);
    const wdTx: TokenTransaction = {
      id: `tx-wd-${Date.now()}`,
      userId: 'usr-lawyer-01',
      userName: `Adv. Raka Mahendra (${bankInfo})`,
      txType: 'WITHDRAWAL',
      tokenDelta: -tokenAmount,
      amountIdr: tokenAmount * 1000,
      midtransOrderId: `HILAW-PAYOUT-${Math.floor(100 + Math.random() * 899)}`,
      paymentStatus: 'SETTLEMENT',
      createdAt: timeStr,
    };
    setTransactions((prev) => [wdTx, ...prev]);
    return true;
  };

  const verifyLawyerApplication = (
    lawyerId: string,
    decision: 'VERIFIED' | 'REJECTED'
  ) => {
    setLawyers((prev) =>
      prev.map((l) =>
        l.id === lawyerId
          ? {
              ...l,
              verificationStatus: decision,
              isOnline: decision === 'VERIFIED',
              availabilityStatus: decision === 'VERIFIED' ? 'ONLINE' : 'OFFLINE',
            }
          : l
      )
    );
  };

  const addTokenPackage = (pkg: Omit<TokenPackage, 'id'>) => {
    const newPkg: TokenPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
    };
    setPackages((prev) => [...prev, newPkg]);
  };

  const resetDemoState = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRole('CLIENT');
    setTokenBalance(120);
    setLawyerBalance(840);
    setLawyers(MOCK_LAWYERS);
    setPackages(MOCK_TOKEN_PACKAGES);
    setTransactions(MOCK_TRANSACTIONS);
    setSessions(MOCK_SESSIONS);
    setMessages(MOCK_MESSAGES);
    setActiveSessionId('ses-active-01');
    setIsConsultationOpen(false);
  };

  return (
    <HiLawContext.Provider
      value={{
        role,
        setRole,
        tokenBalance,
        lawyerBalance,
        lawyers,
        packages,
        transactions,
        sessions,
        messages,
        activeSessionId,
        setActiveSessionId,
        isConsultationOpen,
        setIsConsultationOpen,
        isTopUpOpen,
        openTopUpModal,
        closeTopUpModal,
        selectedPackage,
        setSelectedPackage,
        processMidtransTopUp,
        settlePendingTransaction,
        startConsultation,
        sendMessage,
        switchSessionChannel,
        extendSessionDuration,
        toggleLawyerAvailability,
        updateLawyerRates,
        submitLegalResume,
        withdrawLawyerTokens,
        verifyLawyerApplication,
        addTokenPackage,
        resetDemoState,
      }}
    >
      {children}
    </HiLawContext.Provider>
  );
}

export function useHiLaw() {
  const ctx = useContext(HiLawContext);
  if (!ctx) {
    throw new Error('useHiLaw must be used within a HiLawProvider');
  }
  return ctx;
}
