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
      className="rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm font-semibold text-stone-600 transition-all hover:border-stone-400 hover:text-stone-900 hover:shadow-sm active:scale-95"
    >
      Sign out
    </button>
  );
}
