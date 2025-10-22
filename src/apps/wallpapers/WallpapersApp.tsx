import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../lib/supabase"
import { useStore } from "../../store"
import { toast } from "sonner"

type Wallpaper = {
  id: string
  name: string
  full: string
  folder: string
}

const VALID_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"]

export default function WallpapersApp() {
  const [groups, setGroups] = useState<Record<string, Wallpaper[]>>({})
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Wallpaper | null>(null)

  const setWallpaper = useStore((s) => s.setWallpaper)
  const prefsWallpaper = useStore((s) => s.prefs.wallpaper)

  // 🌍 Load global default wallpaper from Supabase (just URL)
  useEffect(() => {
    const fetchGlobalDefault = async () => {
      const { data, error } = await supabase
        .from("defaults")
        .select("value")
        .eq("key", "global_wallpaper")
        .single()

      if (error) {
        console.warn("Failed to load global wallpaper:", error)
        return
      }

      const wallpaperUrl = data?.value
      if (wallpaperUrl && typeof wallpaperUrl === "string") {
        const current = useStore.getState().prefs.wallpaper
        if (!current?.full) {
          useStore.getState().setWallpaper({
            id: "global-default",
            full: wallpaperUrl,
            folder: "default",
            name: "Global Default",
          })
        }
      }
    }

    fetchGlobalDefault()
  }, [])

  // 🧠 Load wallpapers dynamically
  useEffect(() => {
    const loadWallpapers = async () => {
      setLoading(true)
      const grouped: Record<string, Wallpaper[]> = {}

      const { data: folders } = await supabase.storage
        .from("wallpapers")
        .list("", { limit: 100 })

      for (const folder of folders || []) {
        if (!folder.name || folder.name.includes(".")) continue

        const { data: files } = await supabase.storage
          .from("wallpapers")
          .list(folder.name, { limit: 100 })

        const images =
          files
            ?.filter((f) =>
              VALID_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
            )
            .map((f) => ({
              id: `${folder.name}-${f.name}`,
              name: f.name.replace(/\.[^/.]+$/, ""),
              full: supabase.storage
                .from("wallpapers")
                .getPublicUrl(`${folder.name}/${f.name}`).data.publicUrl,
              folder: folder.name,
            })) || []

        if (images.length > 0) grouped[folder.name] = images
      }

      setGroups(grouped)
      setLoading(false)
    }

    loadWallpapers()
  }, [])

  const current = prefsWallpaper?.full

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-gray-700 text-sm">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Loading Desktop Pictures…
        </motion.div>
      </div>
    )

  return (
    <div
      className="h-full w-full grid grid-cols-12 overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #d7d7d7 0%, #b9b9b9 40%, #9a9a9a 100%)",
        fontFamily: "'Lucida Grande','Helvetica Neue',sans-serif",
      }}
    >
      {/* 📸 Left Sidebar - Preview */}
      <div className="col-span-4 border-r border-gray-400/40 flex flex-col items-center justify-center relative">
        <div
          className="relative w-52 h-32 rounded-lg overflow-hidden shadow-inner border border-gray-400"
          style={{
            background: "#ccc",
            boxShadow:
              "inset 0 1px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.25)",
          }}
        >
          {preview?.full ? (
            <img
              src={preview.full}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : current ? (
            <img
              src={current}
              alt="Current wallpaper"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-600">
              No wallpaper selected
            </div>
          )}
        </div>

        <button
          className="mt-4 px-4 py-1.5 rounded-md text-sm font-semibold text-white 
          bg-gradient-to-b from-[#5cb3ff] to-[#0b66c3]
          hover:from-[#6cc3ff] hover:to-[#1a70ca]
          active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.3)] transition-all"
          onClick={() => {
            if (!preview) {
              toast.info("Select a wallpaper first")
              return
            }
            setWallpaper({
              id: preview.id,
              full: preview.full,
              folder: preview.folder,
            })
            toast.success(`Wallpaper set to ${preview.name}`)
          }}
        >
          Set Desktop Picture
        </button>

        {preview && (
          <div className="mt-3 text-xs text-gray-700/80 max-w-[200px] text-center">
            Previewing: <strong>{preview.name}</strong>
          </div>
        )}
      </div>

      {/* 🖼️ Wallpaper Grid */}
      <div className="col-span-8 overflow-y-auto p-5 custom-scrollbar">
        <h2 className="text-base font-semibold mb-4 text-gray-800 drop-shadow-sm">
          Desktop Pictures
        </h2>

        <AnimatePresence>
          {Object.entries(groups).map(([folder, wallpapers]) => (
            <motion.div
              key={folder}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <div className="flex items-center mb-2">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {folder}
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-300/60 to-transparent ml-3" />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {wallpapers.map((wp) => {
                  const isPreview = preview?.id === wp.id
                  const isCurrent = prefsWallpaper?.id === wp.id

                  return (
                    <motion.div
                      key={wp.id}
                      whileHover={{ scale: 1.04 }}
                      className={`relative group rounded-lg overflow-hidden cursor-pointer border transition-all select-none
                        ${
                          isPreview
                            ? "border-blue-400 ring-2 ring-blue-300"
                            : isCurrent
                            ? "border-green-500 ring-2 ring-green-300"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      onClick={() => setPreview(wp)}
                    >
                      <img
                        src={wp.full}
                        alt={wp.name}
                        className="w-full h-24 object-cover transition-all group-hover:brightness-110"
                        draggable={false}
                      />
                      <div
                        className={`absolute bottom-0 left-0 right-0 text-[11px] text-center text-white bg-black/50 backdrop-blur-sm py-[2px]
                        ${
                          isPreview || isCurrent
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {isPreview
                          ? "Previewing"
                          : isCurrent
                          ? "Current"
                          : wp.name}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
