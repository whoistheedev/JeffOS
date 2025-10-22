import React, { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useStore } from "../../store"
import { toast } from "sonner"

type GuestRow = {
  id: string
  handle: string
  message: string
  created_at: string
  anon_id?: string
}

export default function Guestbook() {
  const qc = useQueryClient()
  const anonId = useStore((s) => s.anonId)
  const [handle, setHandle] = useState("")
  const [message, setMessage] = useState("")
  const [startedAt] = useState(() => Date.now())
  const scrollRef = useRef<HTMLDivElement>(null)

  // 📡 Fetch messages
  const { data: entries = [], isLoading, isError } = useQuery<GuestRow[]>({
    queryKey: ["guestbook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guestbook")
        .select("id, handle, message, created_at, anon_id")
        .order("created_at", { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  // ✉️ Send message
  const mutation = useMutation<
    GuestRow,
    Error,
    { anonId: string; handle: string; message: string }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(
        "https://akqqmrqeloasisiybdjx.supabase.co/functions/v1/guestbook-add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
            }`,
          },
          body: JSON.stringify({ ...payload, startedAt }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: (row) => {
      qc.setQueryData<GuestRow[]>(["guestbook"], (old) =>
        old ? [...old, row] : [row]
      )
      setMessage("")
      toast.success("Message sent 💬")
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 150)
    },
    onError: (err) => toast.error(err.message || "Failed to send"),
  })

  // ⚡ Realtime updates
useEffect(() => {
    const channel = supabase
      .channel("guestbook-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guestbook" },
        (payload) => {
          const row = payload.new as GuestRow
          qc.setQueryData<GuestRow[]>(["guestbook"], (old) =>
            old ? [...old, row] : [row]
          )
          if (row.anon_id && row.anon_id !== anonId)
            toast.info(`${row.handle}: ${row.message}`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc, anonId])


  // 🌫️ Container
  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        background:
          "linear-gradient(180deg, #d7d7d7 0%, #b6b6b6 40%, #9b9b9b 100%)",
        borderRadius: "14px",
        boxShadow:
          "inset 0 1px rgba(255,255,255,0.8), inset 0 -1px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.4)",
        overflow: "hidden",
        fontFamily: "'Lucida Grande','Helvetica Neue',sans-serif",
      }}
    >
      {/* Chat */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3 custom-scrollbar">
        {isError ? (
          <div className="text-sm text-red-600">Failed to load entries.</div>
        ) : isLoading ? (
          <div className="text-sm text-gray-600 animate-pulse">Loading…</div>
        ) : (
          <AnimatePresence>
            {entries.map((row) => {
              const isYou = row.anon_id === anonId
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 28,
                  }}
                  className={`flex flex-col ${
                    isYou ? "items-end" : "items-start"
                  }`}
                >
                  <motion.div
                    className={`relative max-w-[70%] px-3 py-2 rounded-2xl text-[13px] leading-snug shadow-md backdrop-blur-md ${
                      isYou
                        ? "bg-gradient-to-b from-[#86c6ff]/80 to-[#4f9aff]/70 text-black rounded-br-none"
                        : "bg-gradient-to-b from-[#ffffff]/80 to-[#dcdcdc]/70 text-black rounded-bl-none"
                    }`}
                    style={{
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    <div
                      className={`text-[11px] font-semibold mb-[2px] ${
                        isYou ? "text-[#004fa8]" : "text-gray-700/90"
                      }`}
                    >
                      {row.handle}
                    </div>
                    <div className="drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">
                      {row.message}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1 text-right">
                      {new Date(row.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                  </motion.div>
                </motion.div>
              )
            })}
            <div ref={scrollRef} />
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!message.trim()) return
          mutation.mutate({ anonId, handle, message })
        }}
        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-t border-[#a6a6a6]/60"
        style={{
          background:
            "linear-gradient(to bottom, #fafafa 0%, #e1e1e1 60%, #bdbdbd 100%)",
        }}
      >
        <input
          type="text"
          placeholder="Name"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          required
          className="w-1/4 px-3 py-2 rounded-full border border-gray-300 text-xs bg-white/90 shadow-inner focus:ring-1 focus:ring-blue-400 outline-none"
        />
        <input
          type="text"
          placeholder="Message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="flex-1 px-3 py-2 rounded-full border border-gray-300 text-xs bg-white/90 shadow-inner focus:ring-1 focus:ring-blue-400 outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={mutation.isPending || isLoading}
          className="px-4 py-2 text-xs font-semibold text-white rounded-full bg-gradient-to-b from-[#6ec6ff] to-[#007aff] hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.25)]"
        >
          Send
        </motion.button>
      </form>
    </div>
  )
}
