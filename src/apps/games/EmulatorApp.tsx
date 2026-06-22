import React, { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { GameLibrary } from "./components/GameLibrary"
import { EmulatorFrame } from "./components/EmulatorFrame"
import { Toolbar } from "./components/Toolbar"
import { Leaderboard } from "./components/Leaderboard"
import { supabase } from "../../lib/supabase"
import { useStore } from "../../store"
import { recordGamePlay } from "../../lib/gameSession"
import { brushedMetal } from "../../lib/aquaSkin"

export interface GameItem {
  title: string
  core: string
  url: string
  thumb: string
}

// 🧩 EmulatorJS-supported systems (mapped to typical folder/core names)
const SUPPORTED_SYSTEMS = [
  "3do",
  "arcade",
  "atari2600",
  "atari5200",
  "atari7800",
  "atarijaguar",
  "atarilynx",
  "colecovision",
  "c64",
  "c128",
  "amiga",
  "pet",
  "plus4",
  "vic20",
  "mame2003",
  "nes",
  "famicom",
  "n64",
  "nds",
  "gba",
  "gb",
  "psx",
  "psp",
  "sega32x",
  "segacd",
  "gamegear",
  "mastersystem",
  "megadrive",
  "saturn",
  "snes",
  "superfamicom",
  "virtualboy",
]

export default function EmulatorApp() {
  const [games, setGames] = useState<GameItem[]>([])
  const [selected, setSelected] = useState<GameItem | null>(null)
  const [started, setStarted] = useState(false)
  const [shader, setShader] = useState("crt-mattias.glslp")
  const [loading, setLoading] = useState(true)
  const [showBoard, setShowBoard] = useState(false)
  const anonId = useStore((s) => s.anonId)

  // Launch a game = record a "play" (game-start) + show the emulator. The
  // leaderboard ranks games by play count (EmulatorJS can't report scores).
  const launchGame = useCallback(
    (game: GameItem) => {
      recordGamePlay(anonId, game.title)
      setSelected(game)
      setStarted(true)
    },
    [anonId]
  )

  // `L` toggles the Most Played board (matches KeyboardHelp).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l" && !e.metaKey && !e.ctrlKey) {
        const el = document.activeElement
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return
        setShowBoard((s) => !s)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const normalize = (str: string) =>
    str.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "")

  // 🚀 Load games — manifest-first, with a fast parallel-list fallback.
  //
  // Phase 1 perf: the old path looped SUPPORTED_SYSTEMS (36) doing one
  // SEQUENTIAL storage list() per system — 32 of which scanned empty folders
  // (~6–11s). Now:
  //   1. Read the precomputed `games_index` table (1 query). When populated,
  //      discovery is O(1) regardless of catalog size — no bucket listing.
  //   2. Fallback (index empty): list the bucket ROOT once to find the folders
  //      that actually exist, then list only those IN PARALLEL — at most ~2
  //      round-trips instead of 37 sequential calls.
  const loadGames = useCallback(async () => {
    try {
      setLoading(true)
      const base = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/games`
      const NO_THUMB = "https://dummyimage.com/512x384/1e1e1e/ffffff&text=No+Thumbnail"

      // 1) Manifest-first: precomputed games_index (1 query, O(1) discovery).
      const { data: indexRows } = await supabase
        .from("games_index")
        .select("game_id, system, title, rom_path, thumb_path")
      if (indexRows && indexRows.length > 0) {
        const items: GameItem[] = indexRows.map((r) => ({
          title: r.title,
          core: r.system,
          url: `${base}/${r.rom_path}`,
          thumb: r.thumb_path ? `${base}/${r.thumb_path}` : NO_THUMB,
        }))
        setGames(items.sort((a, b) => a.title.localeCompare(b.title)))
        return
      }

      // 2) Fallback: discover real folders, then list them in parallel.
      const romExt =
        /\.(nes|smc|sfc|gba|gbc|gb|n64|nds|iso|bin|cue|img|zip|chd|7z|rom)$/i

      // Thumbnails + root folders in parallel (2 calls, not sequential).
      const [thumbsRes, rootRes] = await Promise.all([
        supabase.storage.from("games").list("thumbs", { limit: 500 }),
        supabase.storage.from("games").list("", { limit: 100 }),
      ])

      const thumbMap = new Map<string, string>()
      thumbsRes.data?.forEach((f) => {
        const key = normalize(f.name.replace(/\.(jpg|jpeg|png|webp)$/i, ""))
        thumbMap.set(key, `${base}/thumbs/${f.name}`)
      })

      // Only the folders that actually exist (and that we support), excluding
      // thumbs — no more scanning 32 empty system folders.
      const supported = new Set(SUPPORTED_SYSTEMS)
      const folders = (rootRes.data || [])
        .map((f) => f.name)
        .filter((name) => name && name.toLowerCase() !== "thumbs" && supported.has(name))

      // List each real folder IN PARALLEL.
      const perFolder = await Promise.all(
        folders.map(async (system) => {
          const { data: files } = await supabase.storage
            .from("games")
            .list(system, { limit: 500 })
          return (files || [])
            .filter((f) => romExt.test(f.name))
            .map((f) => {
              const title = f.name.replace(romExt, "")
              const thumb = thumbMap.get(normalize(title)) || NO_THUMB
              return { title, core: system, url: `${base}/${system}/${f.name}`, thumb }
            })
        })
      )

      const all = perFolder.flat()
      setGames(all.sort((a, b) => a.title.localeCompare(b.title)))
    } catch (err) {
      console.error("❌ Error loading games:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // NOTE: a `games-realtime` postgres_changes subscription on storage.objects
  // was removed in Phase 5 (P2.3). storage.objects is not in the
  // supabase_realtime publication, so it never fired; ROM uploads are rare and
  // admin-driven. The games list loads on mount (below) and on remount; a
  // precomputed games_index (P5.1) is the path to live/cheap refresh later.
  useEffect(() => {
    loadGames()
  }, [loadGames])

  return (
    <div className="relative w-full h-full">
    <AnimatePresence mode="wait">
      {!started ? (
        <motion.div
          key="library"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full h-full"
        >
          {loading ? (
            <div
              className="flex flex-wrap justify-center items-center gap-6 p-6 w-full h-full overflow-auto"
              style={brushedMetal}
            >
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="relative w-72 h-44 rounded-lg bg-white/40 overflow-hidden animate-pulse border border-white/50"
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
          ) : (
            <GameLibrary
              games={games}
              loaded={!loading}
              onSelect={launchGame}
            />
          )}
        </motion.div>
      ) : (
        <motion.div
          key="emulator"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col w-full h-full min-h-0 bg-black rounded-b-lg overflow-hidden"
        >
          <Toolbar
            title={selected?.title || ""}
            shader={shader}
            onQuit={() => {
              setStarted(false)
              setSelected(null)
            }}
            onShaderToggle={() =>
              setShader((s) =>
                s === "crt-mattias.glslp" ? "lcd-grid.glslp" : "crt-mattias.glslp"
              )
            }
          />
          {selected && <EmulatorFrame game={selected} shader={shader} />}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Most Played board — toggled by the `L` key. */}
    <Leaderboard
      open={showBoard}
      onClose={() => setShowBoard(false)}
      titleFor={(gid) => games.find((g) => g.title === gid)?.title ?? gid}
    />
    </div>
  )
}
