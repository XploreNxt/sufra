import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm, type Address } from "@/components/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/checkout");

  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, label, address_text, landmark, city, is_default")
    .order("is_default", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
      <CheckoutForm addresses={(addresses ?? []) as Address[]} />
    </main>
  );
}
