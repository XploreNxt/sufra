"use client";

import { useEffect, useState } from "react";
import { saveSubscription, removeSubscription } from "@/app/actions/push";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      !!VAPID;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setEnabled(!!sub);
    });
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Notifications are blocked in your browser settings.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID!),
      });
      const r = await saveSubscription(sub.toJSON() as { endpoint?: string });
      if (r.error) setMsg(r.error);
      else {
        setEnabled(true);
        setMsg("Push notifications are on for this device.");
      }
    } catch {
      setMsg("Couldn't enable notifications on this device.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await removeSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
      setMsg("Push notifications are off for this device.");
    } catch {
      setMsg("Couldn't turn off notifications.");
    }
    setBusy(false);
  }

  if (!supported) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h2 className="font-bold text-stone-900">Push notifications</h2>
      <p className="mt-1 text-xs text-stone-500">
        Get order updates on this device even when Sufra isn’t open.
      </p>
      <div className="mt-3 flex items-center gap-3">
        {enabled ? (
          <button
            onClick={disable}
            disabled={busy}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            {busy ? "…" : "Turn off on this device"}
          </button>
        ) : (
          <button
            onClick={enable}
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {busy ? "…" : "🔔 Enable on this device"}
          </button>
        )}
        {msg && <span className="text-sm text-stone-500">{msg}</span>}
      </div>
    </section>
  );
}
