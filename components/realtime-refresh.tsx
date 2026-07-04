"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Refreshes server data when subscribed tables change (Supabase Realtime).
 * Includes a slow polling fallback for flaky connections — important for
 * low-end Android on patchy networks.
 */
export function RealtimeRefresh({
  channel,
  tables,
  fallbackSeconds = 60,
}: {
  channel: string;
  tables: Array<{ table: string; filter?: string }>;
  fallbackSeconds?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let ch: RealtimeChannel | null = null;
    let cancelled = false;

    (async () => {
      // RLS-protected postgres_changes needs the user's JWT on the
      // realtime connection — set it explicitly before joining.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await supabase.realtime.setAuth(session?.access_token ?? null);
      if (cancelled) return;

      ch = supabase.channel(channel);
      for (const t of tables) {
        ch = ch.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: t.table,
            ...(t.filter ? { filter: t.filter } : {}),
          },
          () => router.refresh()
        );
      }
      ch.subscribe((status, err) => {
        if (status !== "SUBSCRIBED") {
          console.warn(`[realtime] ${channel}: ${status}`, err?.message ?? "");
        }
      });
    })();

    const poll = setInterval(() => router.refresh(), fallbackSeconds * 1000);

    return () => {
      cancelled = true;
      if (ch) supabase.removeChannel(ch);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, JSON.stringify(tables), fallbackSeconds]);

  return null;
}
