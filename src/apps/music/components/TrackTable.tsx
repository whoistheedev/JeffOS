import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TrackTableProps {
  onSelectTrack: (t: any) => void
  token?: string | null
}

export function TrackTable({ onSelectTrack, token }: TrackTableProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const playlistId = "5BthhwAJPxSgMrQ22GLcj1"
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error.message)
        setTracks(d.items ?? [])
        setError(null)
      })
      .catch((e) => {
        console.error("Track fetch error:", e)
        setError("Unable to load tracks — using cached layout.")
      })
  }, [token])

  return (
    <div
      className="
        relative flex-1 overflow-auto 
        bg-[linear-gradient(180deg,#e6e6e6_0%,#d3d3d3_100%)]
        dark:bg-[linear-gradient(180deg,#1a1a1a_0%,#111_100%)]
        text-[12px] font-[Lucida_Grande,system-ui,sans-serif]
        text-[#222] dark:text-neutral-200
        select-none scrollbar-thin scrollbar-thumb-[#b6b6b6]/40 scrollbar-track-transparent
        border-t border-[#a1a1a1]/40
      "
    >
      <table className="w-full border-collapse relative z-10">
        {/* Header */}
        <thead>
          <tr
            className="
              bg-[linear-gradient(180deg,#fefefe_0%,#d9d9d9_100%)]
              border-b border-[#a1a1a1]/60
              text-[11px] uppercase tracking-wide text-[#333]
              font-semibold sticky top-0 z-20
              shadow-[inset_0_1px_rgba(255,255,255,0.8)]
            "
          >
            <th className="text-left px-3 py-1 w-8 font-normal">#</th>
            <th className="text-left px-3 py-1 font-normal">Title</th>
            <th className="text-left px-3 py-1 font-normal">Artist</th>
            <th className="text-right px-3 py-1 font-normal">Time</th>
          </tr>
        </thead>

        {/* Rows */}
        <tbody>
          <AnimatePresence initial={false}>
            {tracks.map((item, i) => {
              const t = item.track
              const isActive = activeId === t.id
              const even = i % 2 === 0

              return (
                <motion.tr
                  key={t.id ?? i}
                  onClick={() => {
                    setActiveId(t.id)
                    onSelectTrack(t)
                  }}
                  layout
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  className={`
                    cursor-default transition-colors duration-150
                    ${
                      isActive
                        ? "bg-[linear-gradient(180deg,#4ea2ff_0%,#1a6aff_100%)] text-white shadow-[inset_0_1px_rgba(255,255,255,0.3),inset_0_-1px_rgba(0,0,0,0.25)]"
                        : even
                        ? "bg-[linear-gradient(180deg,#f7f7f7_0%,#ececec_100%)] hover:bg-[rgba(120,180,255,0.2)]"
                        : "bg-[linear-gradient(180deg,#f2f2f2_0%,#e5e5e5_100%)] hover:bg-[rgba(120,180,255,0.2)]"
                    }
                  `}
                >
                  <td
                    className={`px-3 py-[6px] text-center ${
                      isActive ? "text-white/90" : "text-[#555]"
                    }`}
                  >
                    {i + 1}
                  </td>
                  <td
                    className={`px-3 py-[6px] truncate flex items-center gap-1 ${
                      isActive ? "font-semibold" : ""
                    }`}
                  >
                    {t.preview_url && (
                      <span className="text-[10px] opacity-60">🎧</span>
                    )}
                    {t.name}
                  </td>
                  <td
                    className={`px-3 py-[6px] text-[#555] truncate ${
                      isActive ? "text-white/90" : ""
                    }`}
                  >
                    {t.artists.map((a: any) => a.name).join(", ")}
                  </td>
                  <td
                    className={`px-3 py-[6px] text-right tabular-nums ${
                      isActive ? "text-white/90" : "text-[#555]"
                    }`}
                  >
                    {formatDuration(t.duration_ms)}
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </tbody>
      </table>

      {/* faint horizontal stripes overlay */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)]
          bg-[length:100%_26px]
          opacity-50
          z-0
        "
      />

      {/* error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[11px] px-3 py-1 rounded-full shadow-md"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Helpers ---------- */
function formatDuration(ms: number) {
  if (!ms) return ""
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}
