'use client';

import React, { useState } from 'react';
import {
  Users,
  ThumbsUp,
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  TrendingUp,
  FileBadge,
} from 'lucide-react';
import { useHiLaw } from '@/context/HiLawContext';

export default function AdminDashboardView() {
  const {
    lawyers,
    transactions,
    packages,
    verifyLawyerApplication,
    settlePendingTransaction,
    addTokenPackage,
  } = useHiLaw();

  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgTokens, setNewPkgTokens] = useState(150);
  const [newPkgBonus, setNewPkgBonus] = useState(15);
  const [newPkgPrice, setNewPkgPrice] = useState(140000);

  const verifiedLawyers = lawyers.filter(
    (l) => l.verificationStatus === 'VERIFIED'
  );
  const pendingLawyers = lawyers.filter(
    (l) => l.verificationStatus === 'PENDING'
  );

  const settledMidtransRevenue = transactions
    .filter(
      (t) => t.txType === 'TOPUP_MIDTRANS' && t.paymentStatus === 'SETTLEMENT'
    )
    .reduce((acc, item) => acc + item.amountIdr, 0);

  const avgSatisfaction =
    verifiedLawyers.length > 0
      ? (
          verifiedLawyers.reduce((acc, l) => acc + l.satisfactionRate, 0) /
          verifiedLawyers.length
        ).toFixed(1)
      : '98.5';

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;
    addTokenPackage({
      packageName: newPkgName.trim(),
      tokenAmount: Number(newPkgTokens),
      bonusTokens: Number(newPkgBonus),
      priceIdr: Number(newPkgPrice),
      description: `Paket kustom ${newPkgTokens} LawToken (+${newPkgBonus} Bonus Token).`,
    });
    setNewPkgName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Executive BMLC */}
      <div className="bg-[#1E293B] text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3B5BDB] text-white">
            <TrendingUp className="w-3.5 h-3.5" /> Executive Control Center • BMLC
            HiLaw
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1.5">
            Dashboard Operasional, Verifikasi PERADI & Monitoring Midtrans
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Memantau Key Metrics BMLC, kurasi lisensi advokat (Unfair Advantage), dan
            aliran pendapatan LawToken.
          </p>
        </div>
      </div>

      {/* 1. Key Metrics BMLC (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>PENGGUNA TERDAFTAR (BMLC)</span>
            <Users className="w-4 h-4 text-[#3B5BDB]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-1.5">
            1.428 Pengguna
          </div>
          <p className="text-xs text-[#0CA678] font-semibold mt-0.5">
            +18.4% pertumbuhan bulan ini
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>KEPUASAN PELANGGAN (CSAT)</span>
            <ThumbsUp className="w-4 h-4 text-[#0CA678]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-1.5">
            {avgSatisfaction}% Puas
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Dari seluruh sesi konsultasi selesai
          </p>
        </div>

        <div className="bg-[#FFF9DB]/60 rounded-2xl border border-[#FCC419]/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#B45309]">
            <span>PENDAPATAN MIDTRANS (SETTLED)</span>
            <Coins className="w-4 h-4 text-[#F59F00]" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#1E293B] mt-1.5">
            Rp {(settledMidtransRevenue + 48500000).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-[#92400E] mt-0.5">
            Termasuk Rp {settledMidtransRevenue.toLocaleString('id-ID')} sesi demo
          </p>
        </div>

        <div className="bg-[#E6FCF5]/60 rounded-2xl border border-[#96F2D7] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#0CA678]">
            <span>MITRA ADVOKAT TERVERIFIKASI</span>
            <ShieldCheck className="w-4 h-4 text-[#0CA678]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B] mt-1.5">
            {verifiedLawyers.length} Spesialis
          </div>
          <p className="text-xs text-[#0CA678] font-semibold mt-0.5">
            {pendingLawyers.length} pendaftar menunggu validasi KTA
          </p>
        </div>
      </div>

      {/* 2. Unfair Advantage BMLC: Validasi & Verifikasi Lisensi Pengacara */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6FCF5] text-[#0CA678] flex items-center justify-center">
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1E293B]">
                Validasi & Verifikasi Lisensi Pengacara (Unfair Advantage BMLC)
              </h2>
              <p className="text-xs text-[#64748B]">
                Setujui (Approve) pendaftar baru setelah memeriksa Nomor KTA
                PERADI/KAI & Berita Acara Sumpah (BAS).
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                <th className="py-3 px-3 font-bold">Nama Advokat</th>
                <th className="py-3 px-3 font-bold">Spesialisasi</th>
                <th className="py-3 px-3 font-bold">No. KTA & BAS Pengadilan Tinggi</th>
                <th className="py-3 px-3 font-bold">Tarif Token</th>
                <th className="py-3 px-3 font-bold">Status Verifikasi</th>
                <th className="py-3 px-3 font-bold text-right">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {lawyers.map((lw) => (
                <tr key={lw.id} className="hover:bg-[#F8FAFC]/80">
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#1E293B]">{lw.fullName}</div>
                    <div className="text-[11px] text-[#64748B]">
                      {lw.university} • {lw.experienceYears} Thn
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#EDF2FF] text-[#3B5BDB] font-semibold">
                      {lw.specialization}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <div className="font-bold text-[#1E293B]">
                      {lw.licenseNumber}
                    </div>
                    <div className="text-[11px] text-[#64748B]">{lw.basNumber}</div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    Chat: {lw.tokenRateChat}🪙 / Call: {lw.tokenRateCall}🪙
                  </td>
                  <td className="py-3 px-3">
                    {lw.verificationStatus === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6FCF5] text-[#0CA678] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                      </span>
                    )}
                    {lw.verificationStatus === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF9DB] text-[#B45309] font-bold">
                        <Clock className="w-3.5 h-3.5" /> PENDING REVIEW
                      </span>
                    )}
                    {lw.verificationStatus === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF0F6] text-[#E03131] font-bold">
                        <XCircle className="w-3.5 h-3.5" /> REJECTED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    {lw.verificationStatus !== 'VERIFIED' && (
                      <button
                        type="button"
                        onClick={() => verifyLawyerApplication(lw.id, 'VERIFIED')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0CA678] hover:bg-[#099268] text-white font-bold transition cursor-pointer"
                      >
                        Approve KTA
                      </button>
                    )}
                    {lw.verificationStatus !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => verifyLawyerApplication(lw.id, 'REJECTED')}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#FFF0F6] text-[#E03131] font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Log Transaksi Midtrans & Manajemen Paket LawToken */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabel Monitoring Log Midtrans (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4 shadow-2xs">
          <div>
            <h2 className="text-base font-extrabold text-[#1E293B]">
              Monitoring Log Transaksi Midtrans & Mutasi LawToken
            </h2>
            <p className="text-xs text-[#64748B]">
              Seluruh transaksi Top-Up Midtrans (QRIS, VA, GoPay) dan pemotongan sesi
              konsultasi tercatat real-time.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
                  <th className="py-2.5 px-3 font-bold">Order ID Midtrans</th>
                  <th className="py-2.5 px-3 font-bold">Pengguna & Tipe</th>
                  <th className="py-2.5 px-3 font-bold">Metode</th>
                  <th className="py-2.5 px-3 font-bold">Mutasi Token</th>
                  <th className="py-2.5 px-3 font-bold">Nominal (Rp)</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#1E293B]">
                      <div>{tx.midtransOrderId || tx.id}</div>
                      <div className="text-[10px] text-[#64748B]">{tx.createdAt}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1E293B]">{tx.userName}</div>
                      <div className="text-[10px] text-[#64748B]">{tx.txType}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#3B5BDB] font-bold">
                      {tx.paymentMethod || 'WALLET'}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono font-extrabold ${
                        tx.tokenDelta > 0 ? 'text-[#0CA678]' : 'text-[#E64980]'
                      }`}
                    >
                      {tx.tokenDelta > 0 ? `+${tx.tokenDelta}` : tx.tokenDelta} 🪙
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#1E293B]">
                      Rp {tx.amountIdr.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3">
                      {tx.paymentStatus === 'SETTLEMENT' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#E6FCF5] text-[#0CA678] font-bold text-[10px]">
                          SETTLEMENT
                        </span>
                      )}
                      {tx.paymentStatus === 'PENDING' && (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-[#FFF9DB] text-[#B45309] font-bold text-[10px]">
                            PENDING
                          </span>
                          <button
                            type="button"
                            onClick={() => settlePendingTransaction(tx.id)}
                            className="text-[10px] bg-[#3B5BDB] text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                          >
                            Settle
                          </button>
                        </div>
                      )}
                      {tx.paymentStatus === 'EXPIRE' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-bold text-[10px]">
                          EXPIRE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manajemen Katalog Paket LawToken (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#F59F00]" />
            <h2 className="text-base font-extrabold text-[#1E293B]">
              Tambah Paket LawToken
            </h2>
          </div>

          <form onSubmit={handleCreatePackage} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                Nama Paket Promo
              </label>
              <input
                type="text"
                required
                value={newPkgName}
                onChange={(e) => setNewPkgName(e.target.value)}
                placeholder="Contoh: Paket Keluarga Tenang"
                className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs text-[#1E293B]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Token Utama
                </label>
                <input
                  type="number"
                  min={10}
                  value={newPkgTokens}
                  onChange={(e) => setNewPkgTokens(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs font-mono text-[#1E293B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Bonus Token
                </label>
                <input
                  type="number"
                  min={0}
                  value={newPkgBonus}
                  onChange={(e) => setNewPkgBonus(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs font-mono text-[#1E293B]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                Harga Rupiah (Midtrans)
              </label>
              <input
                type="number"
                min={10000}
                step={5000}
                value={newPkgPrice}
                onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs font-mono text-[#1E293B]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#3B5BDB] hover:bg-[#364FC7] text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              + Tambahkan ke Katalog Midtrans
            </button>
          </form>

          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <div className="text-xs font-bold text-[#64748B]">
              Katalog Paket Aktif ({packages.length}):
            </div>
            {packages.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]"
              >
                <div>
                  <div className="font-bold text-[#1E293B]">{p.packageName}</div>
                  <div className="text-[11px] text-[#B45309]">
                    🪙 {p.tokenAmount} + {p.bonusTokens} Bonus
                  </div>
                </div>
                <span className="font-mono font-bold text-[#3B5BDB]">
                  Rp {p.priceIdr.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
