"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";
import {
  updateProfile,
  requestPasswordChangeOtp,
  changePasswordWithOtp,
} from "@/app/actions/profile";

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
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
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

  function sendCode() {
    setPwErr(null);
    setPwOk(false);
    if (pw.length < 8) {
      setPwErr("Password must be at least 8 characters");
      return;
    }
    if (pw !== pw2) {
      setPwErr("Passwords don't match");
      return;
    }
    startPw(async () => {
      const r = await requestPasswordChangeOtp();
      if (r.error) setPwErr(r.error);
      else setOtpSent(true);
    });
  }

  function confirmChange() {
    setPwErr(null);
    startPw(async () => {
      const r = await changePasswordWithOtp(pw, code);
      if (r.error) setPwErr(r.error);
      else {
        setPwOk(true);
        setOtpSent(false);
        setPw("");
        setPw2("");
        setCode("");
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
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              name="full_name"
              autoComplete="name"
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              name="phone"
              autoComplete="tel"
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
        <p className="mt-1 text-xs text-stone-500">
          For your security, we email a 6-digit code to{" "}
          <span className="font-semibold">{profile.email}</span> to confirm the
          change.
        </p>

        {!otpSent ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={label}>New password</span>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoComplete="new-password"
                  className={field}
                />
              </label>
              <label className="block">
                <span className={label}>Confirm new password</span>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  autoComplete="new-password"
                  className={field}
                />
              </label>
            </div>
            {pwErr && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {pwErr}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={sendCode}
                disabled={pwPending || pw.length < 8}
                className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-stone-800 active:scale-95 disabled:opacity-50"
              >
                {pwPending ? "Sending code…" : "Email me a code"}
              </button>
              {pwOk && (
                <span className="text-sm font-medium text-emerald-700">
                  ✓ Password updated
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              We emailed a 6-digit code to{" "}
              <span className="font-semibold">{profile.email}</span>. Enter it to
              confirm your new password.
            </p>
            <label className="mt-3 block max-w-[12rem]">
              <span className={label}>Verification code</span>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={`${field} text-center text-lg tracking-[0.4em]`}
              />
            </label>
            {pwErr && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {pwErr}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={confirmChange}
                disabled={pwPending || code.length !== 6}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
              >
                {pwPending ? "Updating…" : "Confirm & update password"}
              </button>
              <button
                onClick={() => {
                  setOtpSent(false);
                  setCode("");
                  setPwErr(null);
                }}
                className="text-sm text-stone-500 hover:text-stone-800"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
