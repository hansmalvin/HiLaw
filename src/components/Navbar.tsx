"use client";

import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";
import { useCoins } from "@/store/CoinProvider";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Scale, Bell, Coins, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, roleLabel } from "./auth/AuthProvider";

export default function Navbar() {
  const [open, setOpen] = useState(false),
    [profile, setProfile] = useState(false),
    [notifications, setNotifications] = useState(false);
  const {
    balance,
    consultations,
    ready: coinsReady,
    error: coinsError,
  } = useCoins();
  const path = usePathname(),
    router = useRouter();
  const { user, ready, logout } = useAuth();
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
  // The API already returns only the consultations this account may see.
  const updates = user ? consultations.slice(0, 5) : [];
  const header = useRef<HTMLElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    setProfile(false);
    setNotifications(false);
  }, []);
  // Menus close on a click outside the header or on Escape, like native popovers.
  useEffect(() => {
    if (!open && !profile && !notifications) return;
    const onPointer = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, profile, notifications, close]);

  return (
    <header className="site-header" ref={header}>
      <div className="container nav-row">
        <Link
          href="/"
          className="brand"
          aria-label="HiLaw beranda"
          onClick={close}
        >
          <Scale size={30} />
          HiLaw
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
                      ? balance.toLocaleString("id-ID")
                      : "—"}{" "}
                    Poin
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
                    <UserAvatar name={user.name} url={user.avatarUrl} />
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
                        onClick={async () => {
                          try {
                            await logout();
                            close();
                            router.replace("/");
                          } catch {
                            // AuthProvider displays the failure; retain the current session.
                          }
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
    </header>
  );
}
