import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CoinProvider } from "@/store/CoinProvider";
import { Footer } from "@/components/public/PublicWebsite";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HiLaw — Bantuan Hukum, Kini Lebih Mudah",
  description:
    "Temukan pengacara sesuai kebutuhan dan pahami persoalan hukum Anda bersama HiLaw. Prototipe frontend konsultasi hukum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <AuthProvider>
          <CoinProvider>
            <Suspense
              fallback={
                <header className="site-header">
                  <div className="container nav-row" role="status">
                    Memuat navigasi HiLaw…
                  </div>
                </header>
              }
            >
              <Navbar />
            </Suspense>
            <main>{children}</main>
            <Footer />
          </CoinProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
