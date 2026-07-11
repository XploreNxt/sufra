"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";
import { updateProfile, changePassword } from "@/app/actions/profile";

const field =
  "mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const label = "text-xs font-semibold text-stone-600";

export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [name, setName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwOk, setPwOk] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwPending, startPw] = useTransition();

  const dirty = name !== (profile.full_name ?? "") || phone !== (profile.phone ?? "");

  function save() {
    setErr(null);
    setOk(false);
    start(async () => {
      const r = await updateProfile({ full_name: name, phone });
      if (r.error) setErr(r.error);
      else {
        setOk(true);
        router.refresh();
      }
    });
  }

  function savePw() {
    setPwErr(null);
    setPwOk(false);
    if (pw !== pw2) {
      setPwErr("Passwords don't match");
      return;
    }
    startPw(async () => {
      const r = await changePassword(pw);
      if (r.error) setPwErr(r.error);
      else {
        setPwOk(true);
        setPw("");
        setPw2("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h2 className="font-bold text-stone-900">Your details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XX XXXXXXX"
              className={field}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Email</span>
            <input
              value={profile.email ?? ""}
              disabled
              className={`${field} cursor-not-allowed bg-stone-50 text-stone-500`}
            />
            <span className="mt-1 block text-[11px] text-stone-400">
              Email is your login and can’t be changed here.
            </span>
          </label>
        </div>
        {err && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={save}
            disabled={pending || !dirty || !name.trim()}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          {ok && <span className="text-sm font-medium text-emerald-700">✓ Saved</span>}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h2 className="font-bold text-stone-900">Change password</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={label}>New password</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Confirm new password</span>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className={field}
            />
          </label>
        </div>
        {pwErr && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwErr}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={savePw}
            disabled={pwPending || pw.length < 8}
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-stone-800 active:scale-95 disabled:opacity-50"
          >
            {pwPending ? "Updating…" : "Update password"}
          </button>
          {pwOk && (
            <span className="text-sm font-medium text-emerald-700">✓ Password updated</span>
          )}
        </div>
      </section>
    </div>
  );
}
