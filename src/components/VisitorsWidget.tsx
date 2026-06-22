import React, { useEffect } from "react"
import { Users } from "lucide-react"
import { useStore } from "../store"
import { supabase } from "../lib/supabase"

export function VisitorsWidget() {
  const [total, setTotal] = React.useState<number>(0)
  const anonId = useStore((s) => s.anonId)

  useEffect(() => {
  if (!anonId) return
  ;(async () => {
    try {
      // Register this visit. The AFTER INSERT trigger on `visits` bumps the
      // visit_stats counter (Phase 5 / P2.1); an upsert that matches the
      // existing anon_id row no-ops (no new insert -> no double count).
      await supabase.from("visits").upsert({ anon_id: anonId })

      // Read the count from the single counter row (PK lookup) instead of
      // COUNT(*) over the whole visits table.
      const { data } = await supabase
        .from("visit_stats")
        .select("total")
        .eq("id", 1)
        .single()
      if (data?.total != null) setTotal(Number(data.total))
    } catch (err) {
      console.warn("Visitor update failed:", err)
    }
  })()

  // Live updates: the counter row updates once per new visit.
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
}, [anonId])


  return (
   <div
  className="fixed bottom-2 right-2 bg-black/60 text-white rounded-full px-3 py-1 flex items-center gap-1 text-sm shadow-lg backdrop-blur transition-opacity duration-500"
  style={{ opacity: total > 0 ? 1 : 0 }}
>
  <Users size={14} /> {total ?? 0}
</div>


  )
}

export default VisitorsWidget
