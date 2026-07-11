import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/customer/profile-editor";
import { PreferencesEditor } from "@/components/customer/preferences-editor";
import { ReferralCard, type RewardVoucher } from "@/components/customer/referral-card";
import { PushToggle } from "@/components/customer/push-toggle";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/profile");

  const supabase = await createClient();
  const [addresses, favorites, orders, rewardRows] = await Promise.all([
    supabase.from("addresses").select("id", { count: "exact", head: true }),
    supabase.from("favorites").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("vouchers")
      .select("code, value, min_order, discount_type, times_used, usage_limit")
      .eq("user_id", profile.id)
      .eq("is_active", true),
  ]);

  const rewards = ((rewardRows.data ?? []) as RewardVoucher[]).filter(
    (v) => v.usage_limit == null || v.times_used < v.usage_limit
  );
  const canApplyReferral =
    profile.referred_by == null && (orders.count ?? 0) === 0;

  const links = [
    { href: "/profile/addresses", icon: "📍", label: "Saved addresses", count: addresses.count },
    { href: "/profile/favorites", icon: "❤️", label: "Favourites", count: favorites.count },
    { href: "/orders", icon: "🧾", label: "Your orders", count: orders.count },
  ];

  const initial = (profile.full_name ?? profile.email ?? "?").charAt(0).toUpperCase();

  return (
    <main className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            {profile.full_name ?? "Your account"}
          </h1>
          <p className="text-sm text-stone-500">{profile.email ?? profile.phone}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200"
          >
            <span className="text-2xl">{l.icon}</span>
            <p className="mt-2 font-bold text-stone-900">{l.label}</p>
            <p className="text-xs text-stone-500">{l.count ?? 0} saved</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <ReferralCard
          code={profile.referral_code}
          canApply={canApplyReferral}
          rewards={rewards}
        />
        <ProfileEditor profile={profile} />
        <PreferencesEditor profile={profile} />
        <PushToggle />
      </div>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h2 className="font-bold text-stone-900">Help &amp; account</h2>
        <p className="mt-2 text-sm text-stone-600">
          Need help with an order? Email{" "}
          <a
            href="mailto:support@sufra.com"
            className="font-semibold text-emerald-700 hover:underline"
          >
            support@sufra.com
          </a>
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
