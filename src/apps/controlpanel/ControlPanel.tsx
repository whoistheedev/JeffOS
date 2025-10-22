// src/apps/controlpanel/ControlPanel.tsx
import React, { useState } from "react"
import { MonitorCog, Volume2, Image } from "lucide-react"
import { useStore } from "../../store"
import type { AppId } from "../../store/apps"

export default function ControlPanel() {
  const openWindow = useStore((s) => s.openWindow)
  const focusWindow = useStore((s) => s.focusWindow)

  const openApp = (appKey: AppId, title?: string) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = 640
    const height = 480
    const x = Math.max(16, Math.floor((vw - width) / 2))
    const y = Math.max(48, Math.floor((vh - height) / 3))
    const winId = `${appKey}-${Math.random().toString(36).slice(2)}`

    openWindow({
      id: winId,
      appKey,
      x,
      y,
      width,
      height,
      minimized: false,
      zoomed: false,
    })
    focusWindow(winId)
  }

  // Tiger-style categories
  const categories = [
    {
      name: "Personal",
      panes: [
        {
          title: "Desktop & Screen Saver",
          icon: Image,
          onClick: () => openApp("wallpapers" as AppId),
        },
      ],
    },
    {
      name: "Hardware",
      panes: [
        {
          title: "Sound",
          icon: Volume2,
          onClick: () => openApp("controlpanel" as AppId, "Sound"), // ✅ Sound pane in ControlPanel
        },
      ],
    },
    {
      name: "System",
      panes: [
        {
          title: "About This Mac",
          icon: MonitorCog,
          onClick: () => openApp("about" as AppId),
        },
      ],
    },
  ]

  return (
    <div className="h-full bg-[var(--menubar-bg)] text-[var(--menubar-fg)] overflow-auto">
      <div className="p-6 space-y-8">
        {categories.map((cat) => (
          <div key={cat.name}>
            <h3 className="text-xs font-semibold uppercase text-gray-600 mb-3">
              {cat.name}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {cat.panes.map((p) => (
                <button
                  key={p.title}
                  onClick={p.onClick}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/80 hover:bg-white shadow transition"
                >
                  <p.icon size={32} />
                  <span className="text-sm text-center">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
