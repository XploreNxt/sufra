import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-emerald-700">
            Food Delivery
          </Link>
          {profile ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-neutral-600 sm:inline">
                {profile.full_name ?? profile.email ?? profile.phone}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
