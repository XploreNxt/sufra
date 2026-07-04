"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Polls fresh server data until Supabase Realtime lands in Phase 7. */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return null;
}
