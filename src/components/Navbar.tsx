'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scale,
  ShieldCheck,
  Coins,
  PlusCircle,
  MessageSquareText,
  UserCheck,
  Briefcase,
  LayoutDashboard,
  RotateCcw,
} from 'lucide-react';
import { useHiLaw } from '@/context/HiLawContext';
import { UserRole } from '@/types/hilaw';

export default function Navbar() {
  const {
    role,
    setRole,
    tokenBalance,
    lawyerBalance,
    openTopUpModal,
    isConsultationOpen,
    setIsConsultationOpen,
    sessions,
    resetDemoState,
  } = useHiLaw();
  const pathname = usePathname();
  const router = useRouter();

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole);
    setIsConsultationOpen(false);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const activeCount = sessions.filter((s) => s.status === 'ACTIVE').length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-[#E2E8F0] shadow-xs print:hidden">
      {/* Top Trust & Role Demo Bar */}
      <div className="bg-[#EDF2FF] border-b border-[#DBE4FF] px-4 py-1.5 text-xs text-[#1E293B]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6FCF5] text-[#0CA678] font-semibold border border-[#96F2D7]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Terverifikasi PERADI & KAI
            </span>
            <span className="hidden sm:inline text-[#64748B]">
              • 100% Rahasia & Dilindungi Kode Etik Advokat • 1 LawToken = Rp 1.000
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#64748B] font-medium hidden md:inline">
              Demo Role Switcher:
            </span>
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-[#CBD5E1] shadow-2xs">
              <button
                type="button"
                onClick={() => handleRoleSwitch('CLIENT')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  role === 'CLIENT'
                    ? 'bg-[#3B5BDB] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                1. Klien (User)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('LAWYER')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  role === 'LAWYER'
                    ? 'bg-[#0CA678] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                2. Pengacara
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  role === 'ADMIN'
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                3. Admin BMLC
              </button>
            </div>

            <button
              type="button"
              onClick={resetDemoState}
              title="Reset Data Simulasi ke Awal"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#64748B] hover:text-[#E03131] hover:bg-white transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden lg:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Halodoc-style Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            onClick={() => setIsConsultationOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#3B5BDB] flex items-center justify-center text-white shadow-sm group-hover:bg-[#364FC7] transition">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[#1E293B]">
                  Hi<span className="text-[#3B5BDB]">Law</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FFF0F6] text-[#E64980] border border-[#FFDEEB]">
                  LegalTech
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-none">
                Solusi Hukum Spesialis Instan
              </p>
            </div>
          </Link>

          {/* Contextual Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-[#64748B]">
            <button
              type="button"
              onClick={() => {
                setRole('CLIENT');
                setIsConsultationOpen(false);
                if (pathname !== '/') router.push('/');
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                role === 'CLIENT' && !isConsultationOpen && pathname === '/'
                  ? 'bg-[#EDF2FF] text-[#3B5BDB] font-semibold'
                  : 'hover:text-[#1E293B] hover:bg-[#F8FAFC]'
              }`}
            >
              Beranda & Spesialis
            </button>

            <button
              type="button"
              onClick={() => {
                setIsConsultationOpen(true);
                if (pathname !== '/') router.push('/');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                isConsultationOpen || pathname === '/consultation'
                  ? 'bg-[#FFF0F6] text-[#E64980] font-semibold'
                  : 'hover:text-[#1E293B] hover:bg-[#F8FAFC]'
              }`}
            >
              <MessageSquareText className="w-4 h-4 text-[#E64980]" />
              Ruang Konsultasi
              {activeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-[#E64980] text-white font-bold">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('LAWYER')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                role === 'LAWYER'
                  ? 'bg-[#E6FCF5] text-[#0CA678] font-semibold'
                  : 'hover:text-[#1E293B] hover:bg-[#F8FAFC]'
              }`}
            >
              Panel Advokat
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('ADMIN')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-[#F1F5F9] text-[#1E293B] font-semibold'
                  : 'hover:text-[#1E293B] hover:bg-[#F8FAFC]'
              }`}
            >
              Admin & Metrik BMLC
            </button>
          </nav>
        </div>

        {/* Right Wallet & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Toggle Consultation Room on Mobile/Desktop */}
          <button
            type="button"
            onClick={() => setIsConsultationOpen(!isConsultationOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isConsultationOpen
                ? 'bg-[#3B5BDB] text-white border-[#3B5BDB]'
                : 'bg-[#F8FAFC] text-[#1E293B] border-[#E2E8F0] hover:bg-[#EDF2FF]'
            }`}
          >
            <MessageSquareText className="w-4 h-4 text-[#E64980]" />
            <span>{isConsultationOpen ? 'Tutup Ruang Sesi' : 'Ruang Sesi Aktif'}</span>
          </button>

          {/* LawToken Balance Pill */}
          <div className="flex items-center gap-2 bg-[#FFF9DB] border border-[#FCC419]/50 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-[#F59F00] text-white flex items-center justify-center font-bold shadow-2xs">
              <Coins className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#B45309]">
                {role === 'LAWYER' ? 'Dompet Advokat' : 'Saldo LawToken'}
              </div>
              <div className="text-sm font-extrabold font-mono text-[#1E293B]">
                {role === 'LAWYER' ? lawyerBalance : tokenBalance}{' '}
                <span className="text-xs font-semibold text-[#92400E]">Token</span>
              </div>
            </div>
          </div>

          {/* Top-Up Button (Midtrans Snap Trigger) */}
          <button
            type="button"
            onClick={() => openTopUpModal()}
            className="inline-flex items-center gap-1.5 bg-[#E64980] hover:bg-[#D6336C] text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Top Up Token</span>
          </button>
        </div>
      </div>
    </header>
  );
}
