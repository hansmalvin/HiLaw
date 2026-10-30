"use client";

import Link from "next/link";
import { useCoins } from "@/store/CoinProvider";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Scale, Bell, Coins, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  useAuth,
  dashboardPath,
  roleLabel,
  type AuthRole,
} from "./auth/AuthProvider";

export default function Navbar() {
  const [open, setOpen] = useState(false),
    [profile, setProfile] = useState(false),
    [notifications, setNotifications] = useState(false);
  const { state: coins, ready: coinsReady, error: coinsError } = useCoins();
  const path = usePathname(),
    router = useRouter();
  const { user, ready, logout, switchRole } = useAuth();
  const links =
    user?.role === "ADMIN"
      ? [["/admin", "Dashboard Admin"]]
      : user?.role === "LAWYER"
        ? [
            ["/", "Beranda"],
            ["/lawyer/dashboard", "Dashboard Pengacara"],
            ["/lawyer/active", "Konsultasi"],
          ]
        : [
            ["/", "Beranda"],
            ["/chatbot", "Chatbot"],
            ["/lawyers", "Cari Pengacara"],
          ];
  const updates = user
    ? coins.consultations
        .filter(
          (c) =>
            user.role === "ADMIN" ||
            (user.role === "CUSTOMER" && c.customerId === user.id) ||
            (user.role === "LAWYER" &&
              coins.platform.lawyers.some(
                (l) => l.userId === user.id && l.id === c.lawyerId,
              )),
        )
        .slice(0, 5)
    : [];
  const close = () => {
    setOpen(false);
    setProfile(false);
    setNotifications(false);
  };

  return (
    <header className="site-header">
      <div className="container nav-row">
        <Link
          href="/"
          className="brand"
          aria-label="HiLaw beranda"
          onClick={close}
        >
          <Scale size={30} />
          {coins.platform.settings.platformName}
          <span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile-toggle"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          aria-label="Navigasi utama"
          className={open ? "navigation open" : "navigation"}
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={close}
            >
              {label}
            </Link>
          ))}
          <div className="auth-links">
            {!ready ? (
              <span role="status">Memuat…</span>
            ) : !user ? (
              <>
                <Link href="/sign-in" onClick={close}>
                  Sign In
                </Link>
                <Link className="button small" href="/sign-up" onClick={close}>
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {user.role === "CUSTOMER" && (
                  <Link
                    className="wallet-nav"
                    href="/customer/top-up"
                    onClick={close}
                  >
                    <Coins size={17} />
                    {coinsReady && !coinsError
                      ? (coins.balances[user.id] ?? 0).toLocaleString("id-ID")
                      : "—"}{" "}
                    Coins
                  </Link>
                )}
                <div className="nav-popover">
                  <button
                    className="nav-icon"
                    aria-label="Notifikasi"
                    aria-expanded={notifications}
                    onClick={() => {
                      setNotifications(!notifications);
                      setProfile(false);
                    }}
                  >
                    <Bell size={19} />
                  </button>
                  {notifications && (
                    <div className="nav-dropdown notification-dropdown">
                      <strong>Aktivitas konsultasi</strong>
                      {updates.length ? (
                        updates.map((c) => (
                          <Link
                            key={c.id}
                            className="notification-item"
                            href={"/consultations/" + c.id}
                            onClick={close}
                          >
                            {user.role === "LAWYER"
                              ? c.customerName
                              : c.lawyerName}
                            <small>Status: {c.status}</small>
                          </Link>
                        ))
                      ) : (
                        <p>Belum ada aktivitas konsultasi.</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="nav-popover">
                  <button
                    className="avatar-button"
                    aria-label="Menu profil"
                    aria-expanded={profile}
                    onClick={() => {
                      setProfile(!profile);
                      setNotifications(false);
                    }}
                  >
                    <span className="user-initial">{user.name[0]}</span>
                    <ChevronDown size={14} />
                  </button>
                  {profile && (
                    <div className="nav-dropdown">
                      <strong>{user.name}</strong>
                      <small>{roleLabel[user.role]}</small>
                      <Link
                        href={
                          user.role === "ADMIN"
                            ? "/admin/settings"
                            : user.role === "LAWYER"
                              ? "/lawyer/profile"
                              : "/customer/profile"
                        }
                        onClick={close}
                      >
                        Profil
                      </Link>
                      <Link
                        href={
                          user.role === "ADMIN"
                            ? "/admin/settings"
                            : user.role === "LAWYER"
                              ? "/lawyer/settings"
                              : "/customer/settings"
                        }
                        onClick={close}
                      >
                        Pengaturan
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          close();
                          router.push("/");
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
      {ready && user && (
        <div className="demo-role-bar">
          <div className="container">
            <label>
              Demo role{" "}
              <select
                aria-label="Ganti role demo"
                value={user.role}
                onChange={(e) => {
                  const role = e.target.value as AuthRole;
                  switchRole(role);
                  close();
                  router.push(dashboardPath(role));
                }}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="LAWYER">Pengacara</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <small>Simulasi frontend</small>
          </div>
        </div>
      )}
    </header>
  );
}
