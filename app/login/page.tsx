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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // Profile row is created by the on_auth_user_created trigger.
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();
    const role = (profile?.role ?? "customer") as UserRole;

    const next = searchParams.get("next");
    router.replace(next ?? homePathForRole(role));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {step === "phone"
            ? "Enter your mobile number to receive a one-time code."
            : `We sent a code to ${phone}.`}
        </p>

        {step === "phone" ? (
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
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
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
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-center text-lg tracking-[0.4em] text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
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
