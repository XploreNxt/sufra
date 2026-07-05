import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { getRiderProfile } from "@/lib/db/rider";
import { LogoutButton } from "@/components/logout-button";
import { RiderOnlineToggle } from "@/components/rider/online-toggle";
import { SufraLogo } from "@/components/brand";

export default async function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/rider");
  if (profile.role !== "rider" && profile.role !== "admin") redirect("/");

  const rider = await getRiderProfile();

  if (!rider || rider.status !== "active") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900">
            {rider ? "Application under review" : "No rider profile"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {rider
              ? "Your rider application is waiting for admin approval."
              : "Rider onboarding is handled by the admin for now."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="s-glass sticky top-0 z-10 border-b border-stone-200/70">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between gap-3 px-4">
          <SufraLogo suffix="Rider" href="/rider" />
          <div className="flex items-center gap-2">
            <RiderOnlineToggle isOnline={rider.is_online} />
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-2xl gap-1 px-4 pb-2 text-sm font-medium">
          <Link
            href="/rider"
            className="rounded-lg px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            Deliveries
          </Link>
          <Link
            href="/rider/cod"
            className="rounded-lg px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            Cash &amp; earnings
          </Link>
        </nav>
      </header>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
