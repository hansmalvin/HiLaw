"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  useAuth,
  dashboardPath,
  demoUsers,
  roleLabel,
  type AuthRole,
} from "./AuthProvider";

export default function AuthForm({ register = false }: { register?: boolean }) {
  const submitted = useRef(false);
  const { user, ready, signIn, signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [role, setRole] = useState<AuthRole>("CUSTOMER"),
    [remember, setRemember] = useState(false),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [forgot, setForgot] = useState(false);
  useEffect(() => {
    if (ready && user && !submitted.current)
      router.replace(dashboardPath(user.role));
  }, [ready, user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (register && password !== confirm) {
      setError("Konfirmasi password belum sesuai.");

      return;
    }
    submitted.current = true;
    setBusy(true);
    try {
      const account = register
        ? await signUp(
            {
              name,
              email,
              phone,
              role,
            },
            password,
          )
        : await signIn(email, password, remember);
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        account.role === "CUSTOMER" &&
        next &&
        /^\/lawyers\/[a-z0-9-]+$/.test(next)
          ? next
          : null;
      router.replace(safeNext || dashboardPath(account.role));
    } catch (err) {
      submitted.current = false;
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kendala. Silakan coba lagi.",
      );
      setBusy(false);
    }
  }
  if (!ready || user)
    return (
      <div className="container section" role="status">
        Menyiapkan session Anda…
      </div>
    );

  return (
    <div className="container auth-layout section">
      <aside className="auth-story">
        <span className="eyebrow">SELAMAT DATANG DI HILAW</span>
        <h1>
          Langkah pertama
          <br />
          untuk lebih tenang.
        </h1>
        <p>Temukan pendamping yang memahami kebutuhan hukum Anda.</p>
        <ShieldCheck size={65} />
        <div>
          <strong>Akun untuk setiap kebutuhan</strong>
          <p>
            Customer mencari pendampingan, pengacara membantu memberi arah,
            admin mengelola platform.
          </p>
        </div>
        <small>
          Simulasi frontend. Session localStorage bukan autentikasi aman untuk
          produksi. Gunakan data dan password khusus demo.
        </small>
      </aside>
      <section className="auth-form-card">
        <span className="eyebrow">RUANG ANDA DI HILAW</span>
        <h2>{register ? "Buat akun baru" : "Senang bertemu kembali"}</h2>
        <p>
          {register
            ? "Mulai perjalanan Anda bersama HiLaw."
            : "Masuk untuk melanjutkan ke dashboard Anda."}
        </p>
        <form onSubmit={submit} className="auth-form">
          {register && (
            <label>
              Nama lengkap
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Nama lengkap Anda"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="nama@email.com"
            />
          </label>
          {register && (
            <label>
              Nomor telepon
              <input
                type="tel"
                required
                pattern="[+]?[0-9 -]{9,16}"
                title="Gunakan 9–16 karakter berupa angka, spasi, atau tanda hubung."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="081234567890"
              />
            </label>
          )}
          <label>
            Password
            <div className="password-field">
              <input
                type={show ? "text" : "password"}
                required
                minLength={register ? 8 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={register ? "Minimal 8 karakter" : "Password Anda"}
              />
              <button
                type="button"
                aria-label={
                  show ? "Sembunyikan password" : "Tampilkan password"
                }
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {register && (
            <>
              <label>
                Konfirmasi password
                <input
                  required
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Daftar sebagai
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AuthRole)}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="LAWYER">Pengacara</option>
                </select>
              </label>
            </>
          )}
          {!register && (
            <div className="auth-options">
              <label>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember Me
              </label>
              <button type="button" onClick={() => setForgot(true)}>
                Forgot Password?
              </button>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy} type="submit">
            {busy ? "Memproses…" : register ? "Sign Up" : "Sign In"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-alternative">
          {register ? "Sudah memiliki akun?" : "Belum memiliki akun?"}{" "}
          <Link href={register ? "/sign-in" : "/sign-up"}>
            {register ? "Sign In" : "Sign Up"}
          </Link>
        </p>
        {!register && (
          <div className="demo-accounts">
            <strong>Coba dengan akun demo</strong>
            <p>
              Password semua akun: <code>HiLaw123!</code>
            </p>
            {demoUsers.slice(0, 3).map((u) => (
              <button
                type="button"
                key={u.id}
                disabled={busy}
                onClick={() => {
                  setEmail(u.email);
                  setPassword("HiLaw123!");
                  setError("");
                }}
              >
                <span>{roleLabel[u.role]}</span>
                <small>{u.email}</small>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        )}
      </section>
      {forgot && (
        <div className="modal-backdrop" onClick={() => setForgot(false)}>
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setForgot(false);
              if (e.key === "Tab") {
                e.preventDefault();
                e.currentTarget.querySelector("button")?.focus();
              }
            }}
          >
            <h2 id="forgot-title">Pemulihan akun demo</h2>
            <p>
              Email pemulihan belum tersedia pada prototipe. Untuk akun demo
              gunakan password <strong>HiLaw123!</strong>. Untuk akun
              pendaftaran, gunakan password yang Anda buat atau daftar dengan
              email demo lain.
            </p>
            <button
              autoFocus
              className="button"
              onClick={() => setForgot(false)}
            >
              Mengerti
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
