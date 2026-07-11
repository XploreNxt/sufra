import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AddressBook, type SavedAddress } from "@/components/customer/address-book";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/profile/addresses");

  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("id, label, address_text, landmark, city, lat, lng, is_default")
    .order("is_default", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl">
      <Link href="/profile" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Account
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
        Saved addresses
      </h1>
      <p className="mb-5 mt-1 text-sm text-stone-500">
        Manage where we deliver. Your default is used first at checkout.
      </p>
      <AddressBook addresses={(data ?? []) as SavedAddress[]} />
    </main>
  );
}
