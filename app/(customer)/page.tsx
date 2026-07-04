import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

export default async function CustomerHome() {
  const profile = await getSessionProfile();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900">Food Delivery</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Customer home — restaurant discovery lands here in Phase 2.
        </p>

        {profile ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p>
                Signed in as{" "}
                <span className="font-semibold">
                  {profile.full_name ?? profile.phone ?? profile.id}
                </span>
              </p>
              <p>
                Role: <span className="font-semibold">{profile.role}</span>
              </p>
            </div>
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
          >
            Sign in with phone
          </Link>
        )}
      </div>
    </main>
  );
}
