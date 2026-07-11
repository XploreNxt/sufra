"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/types";
import { applyReferral } from "@/app/actions/referral";

export interface RewardVoucher {
  code: string;
  value: number;
  min_order: number;
  discount_type: string;
  times_used: number;
  usage_limit: number | null;
}

export function ReferralCard({
  code,
  canApply,
  rewards,
}: {
  code: string | null;
  canApply: boolean;
  rewards: RewardVoucher[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function copy() {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function apply() {
    setErr(null);
    setMsg(null);
    if (!input.trim()) return;
    start(async () => {
      const r = await applyReferral(input);
      if (r.error) setErr(r.error);
      else {
        setMsg(`Applied! Your Rs 150 welcome voucher: ${r.welcomeCode}`);
        setInput("");
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h2 className="font-bold text-stone-900">Invite friends</h2>
      <p className="mt-1 text-xs text-stone-500">
        Share your code. Your friend gets Rs 150 off their first order, and you
        get Rs 150 once it’s delivered.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-2.5 text-center text-lg font-black tracking-[0.3em] text-emerald-800">
          {code ?? "—"}
        </div>
        <button
          onClick={copy}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-95"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {canApply && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-xs font-semibold text-stone-600">
            Have a friend’s code?
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              maxLength={12}
              className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-sm uppercase tracking-widest outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <button
              onClick={apply}
              disabled={pending || !input.trim()}
              className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {pending ? "…" : "Apply"}
            </button>
          </div>
          {msg && <p className="mt-2 text-sm font-medium text-emerald-700">{msg}</p>}
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </div>
      )}

      {rewards.length > 0 && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-xs font-semibold text-stone-600">Your reward codes</p>
          <ul className="mt-2 space-y-2">
            {rewards.map((v) => (
              <li
                key={v.code}
                className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200"
              >
                <span className="font-mono text-sm font-bold text-amber-900">
                  {v.code}
                </span>
                <span className="text-xs font-semibold text-amber-800">
                  {v.discount_type === "percent"
                    ? `${v.value}% off`
                    : `${formatPrice(v.value)} off`}{" "}
                  · min {formatPrice(v.min_order)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-stone-400">
            Apply these at checkout.
          </p>
        </div>
      )}
    </section>
  );
}
