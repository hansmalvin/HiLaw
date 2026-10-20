import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { HiLawProvider } from '@/context/HiLawContext';
import Navbar from '@/components/Navbar';
import MidtransSnapModal from '@/components/MidtransSnapModal';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['500', '700'],
});

export const metadata: Metadata = {
  title: 'HiLaw — Konsultasi Pengacara Spesialis Online (Halodoc LegalTech)',
  description:
    'Platform konsultasi hukum online bersama spesialis pengacara terverifikasi PERADI/KAI via Chat, Telepon, dan Video Call dengan sistem LawToken & Midtrans.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#1E293B]">
        <HiLawProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <MidtransSnapModal />
          <footer className="bg-white border-t border-[#E2E8F0] py-5 px-4 text-xs text-[#64748B] print:hidden">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="text-[#1E293B]">HiLaw LegalTech</strong> — Prototipe
                Konsultasi Hukum Online Berbasis Spesialis (BMLC & Pastel Legal Trust)
              </div>
              <div>
                Pembayaran Terintegrasi{' '}
                <strong className="text-[#3B5BDB]">Midtrans Snap</strong> • Mitra
                Terverifikasi <strong className="text-[#0CA678]">PERADI & KAI</strong>
              </div>
            </div>
          </footer>
        </HiLawProvider>
      </body>
    </html>
  );
}
