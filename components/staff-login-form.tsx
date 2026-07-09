"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

const GENERIC_ERROR = "Incorrect email or password.";

export function StaffLoginForm({
  requiredRole,
  label,
  badgeClass,
}: {
  requiredRole: UserRole;
  label: string;
  badgeClass: string;
}) {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setLoading(false);
      setError(GENERIC_ERROR);
      return;
    }

    // Verify the account is actually this portal's role. If not, sign back
    // out and show the same generic error — never reveal that the account
    // exists or belongs to a different panel.
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if ((profile?.role as UserRole | undefined) !== requiredRole) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(GENERIC_ERROR);
      return;
    }

    // Hard navigation to the subdomain root (= the portal dashboard). A full
    // load re-runs the proxy so the rewrite resolves cleanly — avoids the
    // client router mishandling a rewrite-to-rewrite transition.
    window.location.assign("/");
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-4">
      <span className="s-float absolute left-[8%] top-[12%] select-none text-7xl opacity-20">
        🍛
      </span>
      <span className="s-float absolute bottom-[14%] right-[10%] select-none text-7xl opacity-20 [animation-delay:1.2s]">
        🍢
      </span>
      <span className="s-float absolute bottom-[20%] left-[16%] select-none text-5xl opacity-15 [animation-delay:2s]">
        🛵
      </span>

      <div className="s-scale-in w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl shadow-emerald-950/40">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg shadow-sm">
            🍽️
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <span className="s-gradient-text">Sufra</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
              >
                {label}
              </span>
            </h1>
            <p className="-mt-0.5 text-xs font-semibold text-stone-400">
              Partner sign in
            </p>
          </div>
        </div>

        <form onSubmit={signIn} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Email</span>
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
            <span className="text-sm font-medium text-stone-700">Password</span>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
