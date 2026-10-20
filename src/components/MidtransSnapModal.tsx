'use client';

import React, { useState } from 'react';
import {
  X,
  QrCode,
  Building2,
  Smartphone,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Coins,
  Sparkles,
} from 'lucide-react';
import { useHiLaw } from '@/context/HiLawContext';
import { PaymentMethod, TokenPackage } from '@/types/hilaw';

const PAYMENT_CHANNELS: {
  id: PaymentMethod;
  label: string;
  sub: string;
  category: 'QRIS' | 'VA' | 'EWALLET' | 'CARD';
}[] = [
  {
    id: 'QRIS',
    label: 'QRIS (Semua E-Wallet & Mobile Banking)',
    sub: 'Scan QR instan via BCA Mobile, Livin, GoPay, OVO, DANA',
    category: 'QRIS',
  },
  {
    id: 'BCA_VA',
    label: 'BCA Virtual Account',
    sub: 'Verifikasi otomatis 24 jam via m-BCA / KlikBCA',
    category: 'VA',
  },
  {
    id: 'MANDIRI_VA',
    label: 'Mandiri Virtual Account',
    sub: 'Bayar instan melalui Livin by Mandiri',
    category: 'VA',
  },
  {
    id: 'BRI_VA',
    label: 'BRI Virtual Account (BRIVA)',
    sub: 'Verifikasi otomatis melalui BRImo',
    category: 'VA',
  },
  {
    id: 'GOPAY',
    label: 'GoPay / ShopeePay Instant',
    sub: 'Buka aplikasi dompet digital secara langsung',
    category: 'EWALLET',
  },
  {
    id: 'CREDIT_CARD',
    label: 'Kartu Kredit / Debit Online (Visa/Mastercard/JCB)',
    sub: 'Dilindungi 3D Secure 2.0 Midtrans',
    category: 'CARD',
  },
];

export default function MidtransSnapModal() {
  const {
    isTopUpOpen,
    closeTopUpModal,
    packages,
    selectedPackage,
    setSelectedPackage,
    processMidtransTopUp,
  } = useHiLaw();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [step, setStep] = useState<'SELECT' | 'SUCCESS'>('SELECT');
  const [lastResultStatus, setLastResultStatus] = useState<'SETTLEMENT' | 'PENDING'>(
    'SETTLEMENT'
  );

  if (!isTopUpOpen) return null;

  const activePkg: TokenPackage = selectedPackage || packages[1] || packages[0];
  const totalTokens = activePkg.tokenAmount + activePkg.bonusTokens;

  const handleSimulatePay = (status: 'SETTLEMENT' | 'PENDING') => {
    processMidtransTopUp(activePkg, paymentMethod, status);
    setLastResultStatus(status);
    setStep('SUCCESS');
  };

  const handleClose = () => {
    setStep('SELECT');
    closeTopUpModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden my-8">
        {/* Midtrans Snap Header */}
        <div className="bg-[#3B5BDB] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Coins className="w-5 h-5 text-[#FCC419]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">HiLaw × Midtrans Snap</span>
                <span className="text-[10px] font-mono uppercase bg-[#0CA678] px-2 py-0.5 rounded-full">
                  Sandbox Mode
                </span>
              </div>
              <p className="text-xs text-[#DBE4FF]">
                Top-Up LawToken Instan • 1 LawToken = Rp 1.000
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'SELECT' ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Step 1: Pilih Paket LawToken */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">
                1. Pilih Paket Isi Ulang LawToken
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {packages.map((pkg) => {
                  const isSelected = activePkg.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg)}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#3B5BDB] bg-[#EDF2FF] ring-2 ring-[#3B5BDB]/20'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {pkg.isPopular && (
                        <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59F00] text-white shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5" /> TERPOPULER
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#1E293B]">
                          {pkg.packageName}
                        </span>
                        <span className="font-mono font-extrabold text-sm text-[#3B5BDB]">
                          Rp {pkg.priceIdr.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B45309] bg-[#FFF9DB] px-2 py-0.5 rounded-md">
                          🪙 {pkg.tokenAmount} Token
                        </span>
                        {pkg.bonusTokens > 0 && (
                          <span className="text-[11px] font-semibold text-[#0CA678] bg-[#E6FCF5] px-2 py-0.5 rounded-md">
                            +Bonus {pkg.bonusTokens} Token
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#64748B] line-clamp-2">
                        {pkg.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ringkasan Tagihan Midtrans */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#64748B]">Total LawToken Diterima</div>
                <div className="text-lg font-extrabold text-[#1E293B] flex items-center gap-1.5">
                  <span>🪙 {totalTokens} LawToken</span>
                  {activePkg.bonusTokens > 0 && (
                    <span className="text-xs font-semibold text-[#0CA678]">
                      (Termasuk +{activePkg.bonusTokens} Bonus)
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#64748B]">Total Tagihan Midtrans</div>
                <div className="text-xl font-mono font-extrabold text-[#3B5BDB]">
                  Rp {activePkg.priceIdr.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Step 2: Pilih Metode Pembayaran Midtrans Snap */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  2. Pilih Metode Pembayaran (Midtrans Snap)
                </label>
                <span className="inline-flex items-center gap-1 text-xs font-mono text-[#E64980]">
                  <Clock className="w-3.5 h-3.5" /> Batas Bayar 23:59:42
                </span>
              </div>

              <div className="space-y-2">
                {PAYMENT_CHANNELS.map((ch) => {
                  const active = paymentMethod === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPaymentMethod(ch.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'border-[#3B5BDB] bg-[#EDF2FF]/70'
                          : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            active
                              ? 'bg-[#3B5BDB] text-white'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          {ch.category === 'QRIS' && <QrCode className="w-5 h-5" />}
                          {ch.category === 'VA' && <Building2 className="w-5 h-5" />}
                          {ch.category === 'EWALLET' && <Smartphone className="w-5 h-5" />}
                          {ch.category === 'CARD' && <CreditCard className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1E293B]">
                            {ch.label}
                          </div>
                          <div className="text-xs text-[#64748B]">{ch.sub}</div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          active ? 'border-[#3B5BDB] bg-[#3B5BDB]' : 'border-[#CBD5E1]'
                        }`}
                      >
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulasi Preview QRIS / Nomor VA */}
            <div className="bg-[#FFF9DB]/60 border border-[#FCC419]/40 rounded-xl p-3.5 flex items-center justify-between text-xs">
              {paymentMethod === 'QRIS' ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-[#1E293B]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1E293B]">
                      Kode QRIS Dinamis NMID: ID202609918271
                    </div>
                    <div className="text-[#64748B]">
                      Klik tombol Settlement di bawah untuk menyimulasikan callback sukses
                      Midtrans.
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-[#1E293B]">
                    Nomor Virtual Account / Billing ({paymentMethod}):{' '}
                    <span className="font-mono text-[#3B5BDB]">8801 0812 9940 2026</span>
                  </div>
                  <div className="text-[#64748B]">
                    Otomatis terverifikasi begitu pembayaran disimulasikan.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => handleSimulatePay('PENDING')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Simulasikan Status Pending
              </button>
              <button
                type="button"
                onClick={() => handleSimulatePay('SETTLEMENT')}
                className="w-full sm:w-auto flex-1 bg-[#0CA678] hover:bg-[#099268] text-white font-bold text-sm px-5 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Simulasikan Pembayaran Berhasil (Settlement +{totalTokens} Token)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                lastResultStatus === 'SETTLEMENT'
                  ? 'bg-[#E6FCF5] text-[#0CA678]'
                  : 'bg-[#FFF9DB] text-[#F59F00]'
              }`}
            >
              {lastResultStatus === 'SETTLEMENT' ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <Clock className="w-10 h-10" />
              )}
            </div>
            <h3 className="text-xl font-extrabold text-[#1E293B]">
              {lastResultStatus === 'SETTLEMENT'
                ? 'Pembayaran Midtrans Berhasil (Settlement)!'
                : 'Transaksi Menunggu Pembayaran (Pending)'}
            </h3>
            <p className="text-sm text-[#64748B] max-w-md mx-auto">
              {lastResultStatus === 'SETTLEMENT'
                ? `Saldo dompet Anda telah bertambah sebesar +${totalTokens} LawToken via metode ${paymentMethod}. Anda kini dapat langsung memulai sesi Chat, Voice, atau Video Call dengan pengacara spesialis.`
                : `Order ${activePkg.packageName} via ${paymentMethod} telah tercatat dengan status PENDING. Anda atau Admin dapat melakukan Settlement dari tabel transaksi.`}
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="bg-[#3B5BDB] hover:bg-[#364FC7] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition cursor-pointer"
              >
                Kembali ke Aplikasi HiLaw
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
