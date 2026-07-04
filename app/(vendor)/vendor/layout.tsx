import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { getActiveRestaurant } from "@/lib/db/vendor";
import { LogoutButton } from "@/components/logout-button";
import { OpenToggle } from "@/components/vendor/open-toggle";
import { RestaurantSwitcher } from "@/components/vendor/restaurant-switcher";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/vendor");
  if (profile.role !== "vendor" && profile.role !== "admin") redirect("/");

  const { restaurant, all } = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900">
            No restaurant yet
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Your account has no restaurant attached. Restaurant onboarding is
            handled by the admin for now.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/vendor"
              className="whitespace-nowrap text-lg font-bold text-emerald-700"
            >
              Vendor
            </Link>
            <RestaurantSwitcher
              restaurants={all.map((r) => ({ id: r.id, name: r.name }))}
              activeId={restaurant.id}
            />
          </div>
          <div className="flex items-center gap-2">
            <OpenToggle
              restaurantId={restaurant.id}
              isOpen={restaurant.is_open}
            />
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-5xl gap-1 px-4 pb-2 text-sm font-medium">
          <Link
            href="/vendor"
            className="rounded-lg px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            Orders
          </Link>
          <Link
            href="/vendor/menu"
            className="rounded-lg px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            Menu
          </Link>
          <Link
            href="/vendor/earnings"
            className="rounded-lg px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            Earnings
          </Link>
        </nav>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
