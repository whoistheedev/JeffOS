import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

/**
 * Visitor count via the `visit_stats` counter row (Phase 5 / P2.1).
 *
 * Previously this ran `select count(*)` on `visits` on mount AND on every
 * realtime event — an O(N^2) "count storm" pattern (and it was also dead,
 * because the supabase_realtime publication had no tables). Phase 5 introduces
 * a single counter row maintained by an AFTER INSERT trigger on `visits`, and
 * publishes ONLY that 1-row `visit_stats` table to realtime. So here we:
 *   - read the one counter row (PK lookup), and
 *   - subscribe to UPDATE on `visit_stats` (one event per visit, O(1)).
 */
export function useVisitors() {
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    // Initial fetch: one counter row.
    supabase
      .from("visit_stats")
      .select("total")
      .eq("id", 1)
      .single()
      .then((res) => {
        if (res.data?.total != null) setTotal(Number(res.data.total))
      })

    // Realtime: the counter row updates once per new visit.
    const channel = supabase
      .channel("visit-stats")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "visit_stats", filter: "id=eq.1" },
        (payload) => {
          const next = (payload.new as { total?: number | string })?.total
          if (next != null) setTotal(Number(next))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { total }
}
