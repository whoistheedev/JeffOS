import React, { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { GameLibrary } from "./components/GameLibrary"
import { EmulatorFrame } from "./components/EmulatorFrame"
import { Toolbar } from "./components/Toolbar"
import { supabase } from "../../lib/supabase"

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

  const normalize = (str: string) =>
    str.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "")

  // 🚀 Load games dynamically for all supported cores
  const loadGames = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all thumbnails
      const { data: thumbs } = await supabase.storage
        .from("games")
        .list("thumbs", { limit: 500 })
      const thumbMap = new Map<string, string>()
      thumbs?.forEach((f) => {
        const key = normalize(f.name.replace(/\.(jpg|jpeg|png|webp)$/i, ""))
        thumbMap.set(
          key,
          `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/games/thumbs/${f.name}`
        )
      })

      const romExt =
        /\.(nes|smc|sfc|gba|gbc|gb|n64|nds|iso|bin|cue|img|zip|chd|7z|rom)$/i
      const all: GameItem[] = []

      // Loop through supported systems
      for (const system of SUPPORTED_SYSTEMS) {
        const { data: files, error } = await supabase.storage
          .from("games")
          .list(system, { limit: 500 })

        if (error || !files) continue

        files.forEach((f) => {
          if (!romExt.test(f.name)) return
          const base = f.name.replace(romExt, "")
          const key = normalize(base)
          const thumb =
            thumbMap.get(key) ||
            "https://dummyimage.com/512x384/1e1e1e/ffffff&text=No+Thumbnail"

          all.push({
            title: base,
            core: system,
            url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/games/${system}/${f.name}`,
            thumb,
          })
        })
      }

      setGames(all.sort((a, b) => a.title.localeCompare(b.title)))
    } catch (err) {
      console.error("❌ Error loading games:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔁 Watch Supabase changes
  useEffect(() => {
    const channel = supabase
      .channel("games-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "storage",
          table: "objects",
          filter: "bucket_id=eq.games",
        },
        () => {
          clearTimeout((window as any)._gamesRefreshTimer)
          ;(window as any)._gamesRefreshTimer = setTimeout(() => loadGames(), 1200)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadGames])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  return (
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
              className="flex flex-wrap justify-center items-center gap-6 p-6 
              w-full h-full bg-gradient-to-b from-[#e7e7e7] to-[#bcbec1] 
              dark:from-[#2c2c2e] dark:to-[#1a1a1c] overflow-auto"
            >
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="relative w-72 h-44 rounded-xl bg-white/10 dark:bg-white/5 
                  overflow-hidden animate-pulse backdrop-blur-md border border-white/10"
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
              onSelect={(game) => {
                setSelected(game)
                setStarted(true)
              }}
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
          className="flex flex-col w-full h-full bg-black rounded-b-lg overflow-hidden"
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
  )
}
