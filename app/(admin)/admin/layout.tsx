import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";
import { SufraLogo } from "@/components/brand";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/riders", label: "Riders" },
  { href: "/admin/vouchers", label: "Vouchers" },
  { href: "/admin/cod", label: "COD settlement" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="s-glass sticky top-0 z-10 border-b border-stone-200/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <SufraLogo suffix="Admin" href="/admin" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {profile.full_name ?? profile.email}
            </span>
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm font-medium">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
