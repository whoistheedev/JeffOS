import type { GameItem } from "../EmulatorApp"
import { thumbUrl } from "../../../lib/imageUrl"

/**
 * GameLibrary — PRESENTATIONAL only (Phase 1 perf).
 *
 * Previously this ran its OWN full bucket discovery (root list + per-folder +
 * thumbs) on mount, duplicating the work EmulatorApp already did. Now it
 * receives the games + loading state as props from EmulatorApp (the single
 * source of truth), so discovery runs exactly once.
 */
export function GameLibrary({
  games,
  loaded,
  onSelect,
}: {
  games: GameItem[]
  loaded: boolean
  onSelect: (g: GameItem) => void
}) {
  // ✨ shimmer-only loader (never shows any text)
  if (!loaded) {
    return (
      <div className="relative flex flex-wrap justify-center gap-6 p-6 w-full h-full 
                      bg-gradient-to-b from-[#e7e7e7] to-[#bcbec1] 
                      dark:from-[#2c2c2e] dark:to-[#1a1a1c] overflow-auto">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="relative w-72 h-44 rounded-xl bg-white/10 dark:bg-white/5 overflow-hidden animate-pulse"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine_1.8s_linear_infinite]" />
          </div>
        ))}
        <style>{`
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    )
  }

  // 🎮 Game Library
  return (
    <div
      className="flex flex-col w-full h-full
                 bg-gradient-to-b from-[#e7e7e7] to-[#bcbec1]
                 dark:from-[#2c2c2e] dark:to-[#1a1a1c]
                 p-6 overflow-auto text-black dark:text-white backdrop-blur-xl"
    >
      <div className="text-center mb-6">
        <h2 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 tracking-wide">
          Game Library
        </h2>
        <div className="mx-auto mt-1 w-16 h-[2px] bg-gradient-to-r from-transparent via-blue-400/80 to-transparent rounded-full" />
      </div>

      {/* Empty state (UX_AUDIT G3) — explicit, not a blank area under the header. */}
      {games.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-600 dark:text-zinc-300">
          <p className="text-sm font-medium">No games found</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">The library is empty right now — check back soon.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((g) => (
          <button
            key={g.url}
            onClick={() => onSelect(g)}
            className="group relative rounded-xl overflow-hidden w-full
                       bg-white/30 dark:bg-white/10 border border-white/40 dark:border-white/15
                       shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_12px_rgba(0,0,0,0.3)]
                       hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(0,0,0,0.35)]
                       transition-all duration-200 ease-out"
          >
            <img
              src={thumbUrl(g.thumb)}
              alt={g.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://dummyimage.com/512x288/1e1e1e/ffffff&text=No+Thumbnail"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent mix-blend-overlay opacity-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-md bg-black/30 flex justify-between items-center">
              <span className="truncate">{g.title}</span>
              <span className="text-[10px] uppercase opacity-70">{g.core}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
