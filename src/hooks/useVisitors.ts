import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export function useVisitors() {
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    // Initial fetch
    supabase.from("visits").select("*", { count: "exact", head: true }).then((res) => {
      if (res.count !== null) setTotal(res.count)
    })

    // Realtime: listen for inserts/updates
    const channel = supabase
      .channel("visitors")
      .on("postgres_changes", { event: "*", schema: "public", table: "visits" }, async () => {
        const { count } = await supabase
          .from("visits")
          .select("*", { count: "exact", head: true })
        if (count !== null) setTotal(count)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { total }
}
