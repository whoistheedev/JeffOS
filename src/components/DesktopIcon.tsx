import React, { useState, useRef } from "react"
import * as ContextMenu from "@radix-ui/react-context-menu"
import { useStore } from "../store"
import type { AppIcon } from "../store/apps"
import { AppIconRenderer } from "./AppIconRenderer"
import { openAboutApp } from "../helpers/openAboutApp"
import { playSystemSound } from "../store/sounds"

type Props = { icon: AppIcon }

export default function DesktopIcon({ icon }: Props) {
  const openWindow = useStore((s) => s.openWindow)
  const focusWindow = useStore((s) => s.focusWindow)
  const icons = useStore((s) => s.desktopIcons)
  const setIcons = useStore((s) => s.setDesktopIcons)
  const trash = useStore((s) => s.trash)
  const setTrash = useStore((s) => s.setTrash)

  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(icon.title)
  const [selected, setSelected] = useState(false)
  const lastTap = useRef(0)
  const touchTimer = useRef<number | null>(null)

  const handleOpen = () => {
  playSystemSound("appOpen")

  // Use deterministic window ID (single-instance)
  const winId = icon.id

  openWindow({
    id: winId,
    appKey: icon.id,
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    minimized: false,
    zoomed: false,
  })

  focusWindow(winId)
}


  function renameIcon() {
    playSystemSound("select")
    setIcons(icons.map((i) => (i.id === icon.id ? { ...i, title } : i)))
    setRenaming(false)
  }

  function removeIcon() {
    playSystemSound("trash")
    setIcons(icons.filter((i) => i.id !== icon.id))
    setTrash([...trash, icon])
  }

  // ✅ Touch handling: double-tap to open, long-press for context menu
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now()
    const delta = now - lastTap.current

    if (delta < 300) {
      e.preventDefault()
      handleOpen()
    }
    lastTap.current = now

    touchTimer.current = window.setTimeout(() => {
      const evt = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
      e.target?.dispatchEvent(evt)
    }, 600)
  }

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
      touchTimer.current = null
    }
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          className={`
            flex flex-col items-center justify-start cursor-pointer select-none
            transition-transform duration-200
            active:scale-95
            ${selected ? "ring-2 ring-blue-400/70 rounded-xl" : ""}
          `}
          onClick={() => setSelected(!selected)}
          onDoubleClick={handleOpen}
          onMouseDown={() => playSystemSound("select")}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 🧱 Icon container — scales responsively */}
          <div
            className={`
              flex items-center justify-center
              w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20
              drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]
              ${selected ? "scale-105" : ""}
            `}
          >
            <AppIconRenderer icon={icon} size="desktop" />
          </div>

          {/* 🏷 Label — macOS Tiger style */}
          {renaming ? (
            <input
              className="
                mt-1 text-center text-xs sm:text-sm text-black
                rounded px-1 py-0.5 bg-white/90
                border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400
              "
              value={title}
              autoFocus
              onBlur={renameIcon}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && renameIcon()}
            />
          ) : (
            <span
              className={`
                mt-1 text-center break-words leading-tight
                text-[11px] sm:text-xs md:text-sm
                font-[system-ui] font-medium
                text-white w-24 sm:w-28 md:w-32
                ${selected
                  ? "bg-blue-600/60 rounded px-1 py-0.5 text-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                  : "text-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                }
              `}
            >
              {icon.title}
            </span>
          )}
        </div>
      </ContextMenu.Trigger>

      {/* 🧭 Context Menu */}
      <ContextMenu.Content
        alignOffset={4}
        className="z-50 min-w-[8rem] rounded-md border bg-white p-1 shadow-lg text-sm"
      >
        <ContextMenu.Item
          onSelect={handleOpen}
          className="cursor-pointer px-2 py-1.5 rounded hover:bg-blue-500/10"
        >
          Open
        </ContextMenu.Item>
        <ContextMenu.Item
          onSelect={() => openAboutApp(icon.id as any)}
          className="px-2 py-1.5 cursor-pointer hover:bg-blue-600 hover:text-white rounded-sm"
        >
          About {icon.title}
        </ContextMenu.Item>
        <ContextMenu.Item
          onSelect={() => setRenaming(true)}
          className="cursor-pointer px-2 py-1.5 rounded hover:bg-blue-500/10"
        >
          Rename
        </ContextMenu.Item>
        <ContextMenu.Item
          onSelect={removeIcon}
          className="cursor-pointer px-2 py-1.5 rounded text-red-600 hover:bg-red-500/10"
        >
          Move to Trash
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
