import React, { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import type { GameItem } from "../EmulatorApp"

export function GameLibrary({ onSelect }: { onSelect: (g: GameItem) => void }) {
  const [games, setGames] = useState<GameItem[]>([])
  const [loaded, setLoaded] = useState(false)

  const normalize = (str: string) =>
    str.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "")

  useEffect(() => {
    let cancelled = false

    const loadGames = async () => {
      try {
        const { data: folders } = await supabase.storage.from("games").list("", { limit: 50 })
        const validFolders = (folders || []).filter(
          (f) => f.name && f.name.toLowerCase() !== "thumbs"
        )

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

        const romExt = /\.(nes|smc|gba|gb|n64|bin|iso|zip|img)$/i
        const all: GameItem[] = []

        for (const folder of validFolders) {
          const { data: files } = await supabase.storage
            .from("games")
            .list(folder.name, { limit: 300 })
          files?.forEach((f) => {
            if (!romExt.test(f.name)) return
            const base = f.name.replace(romExt, "")
            const key = normalize(base)
            const thumb =
              thumbMap.get(key) ||
              "https://dummyimage.com/512x288/1e1e1e/ffffff&text=No+Thumbnail"
            all.push({
              title: base,
              core: folder.name,
              url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/games/${folder.name}/${f.name}`,
              thumb,
            })
          })
        }

        if (!cancelled) {
          setGames(all.sort((a, b) => a.title.localeCompare(b.title)))
          setLoaded(true)
        }
      } catch (err) {
        console.error("❌ Error loading games:", err)
      }
    }

    loadGames()
    return () => {
      cancelled = true
    }
  }, [])

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
              src={g.thumb}
              alt={g.title}
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
