"use client";

import { BackendProfile } from "@/components/auth/BackendProfile";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";
import { LawyerExperience } from "@/components/operations/LawyerExperience";
import { AdminExperience } from "@/components/operations/AdminExperience";
import { CustomerExperience } from "@/components/customer/CustomerExperience";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  Coins,
  History,
  UserRound,
  ShieldCheck,
  Inbox,
  Wallet,
  Users,
  BriefcaseBusiness,
  ChartColumn,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  useAuth,
  dashboardPath,
  roleLabel,
  type AuthRole,
} from "../auth/AuthProvider";

const menus: Record<AuthRole, [string, string, LucideIcon][]> = {
  CUSTOMER: [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["consultations", "Konsultasi Saya", MessageCircle],
    ["top-up", "Poin HiLaw", Coins],
    ["transactions", "Riwayat Transaksi", History],
    ["profile", "Profil", UserRound],
  ],
  LAWYER: [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["requests", "Permintaan Konsultasi", Inbox],
    ["active", "Konsultasi Aktif", MessageCircle],
    ["history", "Riwayat Konsultasi", History],
    ["earnings", "Pendapatan", Wallet],
    ["profile", "Profil Pengacara", UserRound],
  ],
  ADMIN: [
    ["", "Dashboard", LayoutDashboard],
    ["customers", "Kelola Customer", Users],
    ["lawyers", "Kelola Pengacara", BriefcaseBusiness],
    ["verification", "Verifikasi Pengacara", ShieldCheck],
    ["consultations", "Kelola Konsultasi", MessageCircle],
    ["transactions", "Transaksi Poin", Coins],
    ["reports", "Laporan Pendapatan", ChartColumn],
    ["settings", "Pengaturan", Settings],
  ],
};

export function Dashboard({
  role,
  section = "dashboard",
}: {
  role: AuthRole;
  section?: string;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/sign-in");
    else if (user.role !== role) router.replace(dashboardPath(user.role));
  }, [ready, user, role, router]);
  if (!ready || !user || user.role !== role)
    return (
      <div className="container section" role="status">
        Memeriksa session Anda…
      </div>
    );
  const root =
    role === "ADMIN" ? "/admin" : role === "LAWYER" ? "/lawyer" : "/customer";
  const current = menus[role].find(
    ([key]) => key === section || (!key && section === "dashboard"),
  );
  const title =
    current?.[1] ||
    (section === "settings" ? "Pengaturan" : "Halaman tidak ditemukan");
  const isProfile = section === "profile" || section === "settings";

  return (
    <div
      className={`container dashboard-layout section${role === "ADMIN" ? " admin-dashboard" : ""}`}
    >
      <aside className="dashboard-sidebar">
        <span className="eyebrow">RUANG {roleLabel[role].toUpperCase()}</span>
        <div className="sidebar-user">
          <UserAvatar name={user.name} url={user.avatarUrl} />
          <div>
            <strong>{user.name}</strong>
            <small>{roleLabel[role]}</small>
          </div>
        </div>
        <nav aria-label="Menu dashboard">
          {menus[role].map(([key, label, Icon]) => {
            const href = root + (key ? "/" + key : "");

            return (
              <Link
                key={label}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={21} />
          <p>Profil dan verifikasi terhubung ke server.</p>
        </div>
      </aside>
      <div className="dashboard-content">
        <span className="eyebrow">
          DASHBOARD {roleLabel[role].toUpperCase()}
        </span>
        <h1>
          {section === "dashboard"
            ? "Selamat datang, " + user.name.split(" ")[0] + "."
            : title}
        </h1>
        <p className="dashboard-subtitle">
          {section === "dashboard"
            ? "Satu ruang untuk mengelola perjalanan hukum Anda."
            : "Kelola informasi akun dan aktivitas Anda di HiLaw."}
        </p>
        {role === "LAWYER" ? (
          <LawyerExperience section={section} />
        ) : role === "ADMIN" ? (
          <AdminExperience section={section} />
        ) : isProfile ? (
          <BackendProfile />
        ) : (
          <CustomerExperience section={section} />
        )}
      </div>
    </div>
  );
}
