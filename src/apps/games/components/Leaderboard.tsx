import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, X } from "lucide-react"
import { fetchMostPlayed, type MostPlayed } from "../../../lib/gameSession"
import { brushedMetalBar, tigerFont } from "../../../lib/aquaSkin"

/**
 * Leaderboard — the "Most Played" board (plays-only; EmulatorJS can't report
 * scores, so we rank games by how often they're started — see
 * GAME_SCOREBOARD_SCALABILITY_AUDIT.md). Toggled by the `L` key inside Games.
 *
 * `titleFor` maps a stored game_id back to a human title when possible.
 */
export function Leaderboard({
  open,
  onClose,
  titleFor,
}: {
  open: boolean
  onClose: () => void
  titleFor?: (gameId: string) => string
}) {
  const [rows, setRows] = useState<MostPlayed[] | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setRows(null)
    fetchMostPlayed(15).then((r) => {
      if (!cancelled) setRows(r)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="w-full max-w-sm overflow-hidden rounded-xl bg-white text-black shadow-2xl"
            style={{ fontFamily: tigerFont, border: "1px solid #c4c4c4" }}
            role="dialog"
            aria-label="Most Played leaderboard"
          >
            {/* Brushed-metal title bar */}
            <div className="flex items-center justify-between px-3 py-2" style={brushedMetalBar}>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-800">
                <Trophy size={14} aria-hidden /> Most Played
              </span>
              <button onClick={onClose} aria-label="Close leaderboard" className="rounded p-0.5 hover:bg-black/10">
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {rows === null ? (
                <div className="flex items-center justify-center py-8" role="status" aria-label="Loading">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No plays yet — launch a game to get on the board.
                </div>
              ) : (
                <ol className="space-y-1">
                  {rows.map((r, i) => (
                    <li
                      key={r.game_id}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm odd:bg-black/[0.03]"
                    >
                      <span className="w-5 text-right font-mono text-xs text-gray-500">{i + 1}</span>
                      <span className="flex-1 truncate">{titleFor?.(r.game_id) ?? r.game_id}</span>
                      <span className="font-mono text-xs text-gray-600">
                        {r.plays} {r.plays === 1 ? "play" : "plays"}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
