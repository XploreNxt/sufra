"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeOrders } from "@/app/actions/vendor";
import { formatPrice } from "@/types";
import { formatDateTime } from "@/lib/datetime";

export interface NewOrder {
  id: string;
  total: number;
  placed_at: string;
}

// A single shared AudioContext, primed on the first user interaction so
// browser autoplay policy lets the bell ring. No audio file needed — the
// chime is synthesised.
let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  if (sharedCtx.state === "suspended") sharedCtx.resume().catch(() => {});
  return sharedCtx;
}
if (typeof window !== "undefined") {
  const prime = () => getCtx();
  window.addEventListener("pointerdown", prime);
  window.addEventListener("keydown", prime);
}

function chime() {
  const c = getCtx();
  if (!c || c.state !== "running") return; // blocked until a user gesture
  const t0 = c.currentTime;
  // A friendly two-note "ding-dong".
  ([[880, 0], [660, 0.2]] as const).forEach(([freq, at]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + at);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + at);
    osc.stop(t0 + at + 0.45);
  });
}

export function NewOrderAlert({ orders }: { orders: NewOrder[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [muted, setMuted] = useState(false);
  const active = orders.length > 0;

  // Ring on a loop while any order is unacknowledged.
  useEffect(() => {
    if (!active || muted) return;
    chime();
    const timer = window.setInterval(chime, 1800);
    return () => clearInterval(timer);
  }, [active, muted]);

  if (!active) return null;

  function ack(ids: string[]) {
    start(async () => {
      await acknowledgeOrders(ids);
      router.refresh();
    });
  }

  return (
    <div className="s-fade fixed inset-0 z-40 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="s-scale-in w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="animate-bounce text-4xl">🔔</span>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900">
              {orders.length} new {orders.length === 1 ? "order" : "orders"}!
            </h2>
            <p className="text-sm text-stone-500">
              Confirmed and waiting — acknowledge to silence the alarm.
            </p>
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-lg px-2 py-1 text-lg text-stone-400 hover:bg-stone-100"
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-stone-900">
                  #{o.id.slice(0, 8)}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {formatDateTime(o.placed_at)} · {formatPrice(o.total)}
                </p>
              </div>
              <button
                onClick={() => ack([o.id])}
                disabled={pending}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                Acknowledge
              </button>
            </li>
          ))}
        </ul>

        {orders.length > 1 && (
          <button
            onClick={() => ack(orders.map((o) => o.id))}
            disabled={pending}
            className="mt-4 w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            {pending ? "…" : "Acknowledge all"}
          </button>
        )}
      </div>
    </div>
  );
}
