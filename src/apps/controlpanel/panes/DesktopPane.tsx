import React from "react"
import { useStore } from "../../../store"
import { commandBus } from "../../../lib/commandBus"

export default function DesktopPane() {
  const prefs = useStore((s) => s.prefs)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Wallpaper</h3>
      <div className="grid grid-cols-3 gap-2">
        {(prefs.recentWallpapers || []).map((w) => (
          <button
            key={w.id}
            onClick={() => commandBus.dispatch("wallpaper.quickSet", w)}
            className="rounded overflow-hidden border"
          >
            <img src={w.thumbUrl} alt="" className="w-full h-20 object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
