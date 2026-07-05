"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homePathForRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types";

/**
 * Normalize Pakistani phone input to E.164.
 * Accepts "03001234567", "3001234567", "923001234567", "+923001234567".
 */
function normalizePkPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("92")) return `+${digits}`;
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  return `+92${digits}`;
}

type Mode = "email" | "phone";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("email");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function redirectByRole(userId: string) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    const role = (profile?.role ?? "customer") as UserRole;

    const next = searchParams.get("next");
    router.replace(next ?? homePathForRole(role));
    router.refresh();
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setLoading(false);
      setError(error?.message ?? "Sign-in failed. Try again.");
      return;
    }
    await redirectByRole(data.user.id);
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const normalized = normalizePkPhone(phoneInput);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPhone(normalized);
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error || !data.user) {
      setLoading(false);
      setError(error?.message ?? "Verification failed. Try again.");
      return;
    }
    await redirectByRole(data.user.id);
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
  const buttonClass =
    "w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-95 disabled:opacity-50";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-4">
      <span className="s-float absolute left-[8%] top-[12%] select-none text-7xl opacity-20">
        🍛
      </span>
      <span className="s-float absolute bottom-[14%] right-[10%] select-none text-7xl opacity-20 [animation-delay:1.2s]">
        🍢
      </span>
      <span className="s-float absolute bottom-[20%] left-[16%] select-none text-5xl opacity-15 [animation-delay:2s]">
        🍔
      </span>

      <div className="s-scale-in w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl shadow-emerald-950/40">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg shadow-sm">
            🍽️
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="s-gradient-text">Sufra</span>
            </h1>
            <p className="-mt-0.5 text-xs font-semibold text-stone-400">
              dastarkhwan, delivered
            </p>
          </div>
        </div>

        <div className="mt-6 flex rounded-xl bg-stone-100 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("email");
              setError(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 transition-all ${
              mode === "email"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("phone");
              setError(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 transition-all ${
              mode === "phone"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Phone (OTP)
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={signInWithEmail} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">
                Email
              </span>
              <input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">
                Password
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : step === "phone" ? (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">
                Mobile number
              </span>
              <input
                type="tel"
                required
                autoFocus
                inputMode="tel"
                placeholder="03XX XXXXXXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className={inputClass}
              />
            </label>
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <p className="text-sm text-neutral-500">We sent a code to {phone}.</p>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">
                6-digit code
              </span>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={`${inputClass} text-center text-lg tracking-[0.4em]`}
              />
            </label>
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setToken("");
                setError(null);
              }}
              className="w-full text-sm text-neutral-500 hover:text-neutral-700"
            >
              Use a different number
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
