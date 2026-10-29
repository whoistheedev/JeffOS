import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useStore } from "../../store"
import { brushedMetalBar, tigerFont } from "../../lib/aquaSkin"
import { beginBusy } from "../../lib/updateBus"
import { toast } from "sonner"

type GuestRow = {
  id: string
  handle: string
  message: string
  created_at: string
  anon_id?: string
}

/** Deterministic warm avatar color from a name (iChat buddy-pic vibe). */
function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `hsl(${h} 55% 55%)`
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}
function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const y = new Date()
  y.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(d, today)) return "Today"
  if (same(d, y)) return "Yesterday"
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
}

export default function Guestbook() {
  const qc = useQueryClient()
  const anonId = useStore((s) => s.anonId)
  const savedHandle = useStore((s) => s.prefs.handle)
  const setProfile = useStore((s) => s.setProfile)

  const [handle, setHandle] = useState(savedHandle ?? "")
  const [message, setMessage] = useState("")
  const [startedAt] = useState(() => Date.now())
  const [onlineCount, setOnlineCount] = useState(1)
  const [atBottom, setAtBottom] = useState(true)
  const [unseen, setUnseen] = useState(0)

  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  /* 📡 Fetch messages */
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

  /* ✉️ Send message (optimistic, with Sending→sent feel) */
  const mutation = useMutation<
    GuestRow,
    Error,
    { anonId: string; handle: string; message: string }
  >({
    mutationFn: async (payload) => {
      const release = beginBusy("guestbook-submit")
      try {
        const res = await fetch(
          "https://akqqmrqeloasisiybdjx.supabase.co/functions/v1/guestbook-add",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
            },
            body: JSON.stringify({ ...payload, startedAt }),
          }
        )
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      } finally {
        release()
      }
    },
    onSuccess: (row) => {
      qc.setQueryData<GuestRow[]>(["guestbook"], (old) => (old ? [...old, row] : [row]))
      setMessage("")
      scrollToBottom()
    },
    onError: (err) => toast.error(err.message || "Failed to send"),
  })

  /* ⚡ Realtime: new messages */
  useEffect(() => {
    const channel = supabase
      .channel("guestbook-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guestbook" },
        (payload) => {
          const row = payload.new as GuestRow
          qc.setQueryData<GuestRow[]>(["guestbook"], (old) => {
            if (old?.some((r) => r.id === row.id)) return old // de-dupe own optimistic
            return old ? [...old, row] : [row]
          })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  /* 👥 Realtime presence: live "N here now". Key per-TAB (anonId + random),
     not per-anonId, so two tabs/devices of the same visitor each count and the
     number reflects open sessions accurately. */
  useEffect(() => {
    const presenceKey = `${anonId}:${Math.random().toString(36).slice(2, 8)}`
    const channel = supabase.channel("guestbook-presence", {
      config: { presence: { key: presenceKey } },
    })
    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length || 1)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ anon_id: anonId, online_at: new Date().toISOString() })
        }
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [anonId])

  /* Smart autoscroll: stick to bottom only when already there. */
  function scrollToBottom(smooth = true) {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
    setUnseen(0)
  }
  const lastId = entries[entries.length - 1]?.id
  useEffect(() => {
    if (atBottom) scrollToBottom(false)
    else setUnseen((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId])

  function onScroll() {
    const el = listRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setAtBottom(near)
    if (near) setUnseen(0)
  }

  /* Group consecutive messages from the same sender + insert day separators. */
  const grouped = useMemo(() => {
    const out: Array<
      | { kind: "day"; key: string; label: string }
      | { kind: "msg"; row: GuestRow; firstOfGroup: boolean; isYou: boolean }
    > = []
    let prevHandle = ""
    let prevDay = ""
    for (const row of entries) {
      const day = new Date(row.created_at).toDateString()
      if (day !== prevDay) {
        out.push({ kind: "day", key: `day-${day}`, label: dayLabel(row.created_at) })
        prevDay = day
        prevHandle = "" // reset grouping across day breaks
      }
      const firstOfGroup = row.handle !== prevHandle
      out.push({ kind: "msg", row, firstOfGroup, isYou: row.anon_id === anonId })
      prevHandle = row.handle
    }
    return out
  }, [entries, anonId])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const h = handle.trim()
    const m = message.trim()
    if (!h || !m) return
    if (h !== savedHandle) setProfile(h)
    mutation.mutate({ anonId, handle: h, message: m })
  }

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg,#dfe7f0 0%,#cdd8e6 100%)",
        fontFamily: tigerFont,
      }}
    >
      {/* iChat-style header */}
      <div
        className="flex items-center gap-2 px-3 h-[34px] shrink-0"
        style={brushedMetalBar}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#33cc4a] opacity-60 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2db83f] shadow-[inset_0_1px_rgba(255,255,255,0.7)]" />
        </span>
        <span className="text-[12.5px] font-semibold text-[#2b2b2b]">Guestbook</span>
        <span className="ml-auto text-[11px] text-[#555]">
          {onlineCount} {onlineCount === 1 ? "person" : "people"} here
        </span>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={onScroll}
        className="flex-1 overflow-auto px-3 py-3 custom-scrollbar relative"
      >
        {isError ? (
          <div className="text-sm text-red-600">Failed to load entries.</div>
        ) : isLoading ? (
          <div className="text-sm text-gray-600 animate-pulse">Loading…</div>
        ) : (
          <AnimatePresence initial={false}>
            {grouped.map((item) =>
              item.kind === "day" ? (
                <div key={item.key} className="flex items-center justify-center my-3">
                  <span className="text-[10px] font-medium text-[#5a6b7d] bg-white/50 px-2 py-[2px] rounded-full">
                    {item.label}
                  </span>
                </div>
              ) : (
                <Bubble key={item.row.id} {...item} />
              )
            )}
            <div ref={bottomRef} />
          </AnimatePresence>
        )}

        {/* New-messages pill (when scrolled up) */}
        <AnimatePresence>
          {unseen > 0 && !atBottom && (
            <motion.button
              key="new-pill"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => scrollToBottom()}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 block bg-[#1f8aff] text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-lg hover:bg-[#1577e0]"
            >
              {unseen} new ↓
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <form
        onSubmit={submit}
        className="shrink-0 flex items-center gap-2 px-3 py-2 border-t border-[#9fb0c2]/60"
        style={brushedMetalBar}
      >
        <input
          type="text"
          placeholder="Name"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          required
          className="w-[22%] min-w-[64px] px-3 py-[7px] rounded-full border border-[#9aa6b2] text-xs bg-white/95 shadow-inner focus:ring-1 focus:ring-blue-400 outline-none"
        />
        <input
          type="text"
          placeholder="Message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="flex-1 px-3 py-[7px] rounded-full border border-[#9aa6b2] text-xs bg-white/95 shadow-inner focus:ring-1 focus:ring-blue-400 outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={mutation.isPending || isLoading}
          className="px-4 py-[7px] text-xs font-semibold rounded-full text-white disabled:opacity-60"
          style={{
            background: "linear-gradient(180deg,#7fb6ff 0%,#2f86e0 50%,#1f6fc4 100%)",
            border: "1px solid #2169b0",
            boxShadow: "inset 0 1px rgba(255,255,255,0.7), 0 1px 1px rgba(0,0,0,0.25)",
            textShadow: "0 1px 1px rgba(0,0,0,0.3)",
          }}
        >
          {mutation.isPending ? "Sending…" : "Send"}
        </motion.button>
      </form>
    </div>
  )
}

/* ---------- iChat AV gel bubble ---------- */
function Bubble({
  row,
  firstOfGroup,
  isYou,
}: {
  row: GuestRow
  firstOfGroup: boolean
  isYou: boolean
}) {
  const time = new Date(row.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
  const avatar = (
    <div
      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white shadow-[inset_0_1px_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.3)]"
      style={{ background: avatarColor(row.handle), visibility: firstOfGroup ? "visible" : "hidden" }}
    >
      {initials(row.handle)}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 460, damping: 30 }}
      className={`flex items-end gap-2 ${firstOfGroup ? "mt-2" : "mt-[3px]"} ${
        isYou ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {avatar}
      <div className={`flex flex-col max-w-[74%] ${isYou ? "items-end" : "items-start"}`}>
        {firstOfGroup && (
          <span className="text-[10.5px] font-semibold text-[#46586a] px-1 mb-[2px]">
            {isYou ? "You" : row.handle}
          </span>
        )}
        <div
          className="relative px-3 py-[6px] text-[13px] leading-snug"
          style={
            isYou
              ? {
                  // Aqua-blue gel (iChat "me")
                  background: "linear-gradient(180deg,#7db9ff 0%,#3f93ec 50%,#2f81dd 51%,#2876d4 100%)",
                  color: "#fff",
                  borderRadius: 15,
                  border: "1px solid rgba(31,105,176,0.8)",
                  boxShadow: "inset 0 1px rgba(255,255,255,0.55), 0 1px 1px rgba(0,0,0,0.2)",
                  textShadow: "0 1px 1px rgba(0,0,0,0.18)",
                }
              : {
                  // Glossy grey gel (iChat "them")
                  background: "linear-gradient(180deg,#ffffff 0%,#eceef1 50%,#e2e5e9 51%,#dcdfe3 100%)",
                  color: "#1b1b1b",
                  borderRadius: 15,
                  border: "1px solid rgba(150,158,168,0.8)",
                  boxShadow: "inset 0 1px rgba(255,255,255,0.9), 0 1px 1px rgba(0,0,0,0.12)",
                }
          }
        >
          {/* glass top sheen */}
          <span
            className="pointer-events-none absolute inset-x-[3px] top-[2px] h-[40%] rounded-[12px]"
            style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.5),transparent)" }}
          />
          <span className="relative">{row.message}</span>
        </div>
        <span className="text-[9.5px] text-[#7a8a9a] px-1 mt-[1px]">{time}</span>
      </div>
    </motion.div>
  )
}
