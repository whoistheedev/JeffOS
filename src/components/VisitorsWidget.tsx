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
      await supabase.from("visits").upsert({ anon_id: anonId })
      const { count } = await supabase
        .from("visits")
        .select("*", { count: "exact", head: true })
      setTotal(count ?? 0)
    } catch (err) {
      console.warn("Visitor update failed:", err)
    }
  })()
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
