"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
    >
      Sign out
    </button>
  );
}
