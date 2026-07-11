"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

const GENERIC_ERROR = "Incorrect email or password.";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Customer-only door: non-customers get the same generic error. */
  async function finishAsCustomer(userId: string): Promise<boolean> {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    const role = (profile?.role ?? "customer") as UserRole;

    if (role !== "customer") {
      await supabase.auth.signOut();
      setLoading(false);
      setError(GENERIC_ERROR);
      return false;
    }

    const next = searchParams.get("next");
    router.replace(next ?? "/");
    router.refresh();
    return true;
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
      setError(GENERIC_ERROR);
      return;
    }
    await finishAsCustomer(data.user.id);
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

        <form onSubmit={signInWithEmail} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Email</span>
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
