// src/components/StatusBar.tsx
import React, { useMemo, useEffect } from "react"
import {
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Volume2,
  VolumeX,
} from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Popover from "@radix-ui/react-popover"
import { motion } from "framer-motion"
import { useClock } from "../hooks/useClock"
import { useNetwork } from "../hooks/useNetwork"
import { useBattery } from "../hooks/useBattery"
import { useStore } from "../store"
import type { AppId } from "../store/apps"
import { AppIconRenderer } from "./AppIconRenderer"
import { openAboutApp } from "../helpers/openAboutApp"
import { finderMenus } from "../config/menus/finderMenus"
import { appsMenus } from "../config/menus/appsMenus"
import type { AppMenus, MenuItemEntry } from "../types"


const MenuItem: React.FC<{
  onClick?: () => void
  children: React.ReactNode
  iconRenderer?: React.ReactNode
}> = ({ onClick, children, iconRenderer }) => (
  <DropdownMenu.Item
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-600 hover:text-white rounded-sm text-[13px]"
  >
    {iconRenderer}
    {children}
  </DropdownMenu.Item>
)

export default function StatusBar() {
  const { label } = useClock()
  const { online, effectiveType } = useNetwork()
  const { supported: batterySupported, battery } = useBattery()

  const prefs = useStore((s) => s.prefs)
  const toggleSound = useStore((s) => s.toggleSound)
  const setVolume = useStore((s) => s.setVolume)
  const apps = useStore((s) => s.apps)
  const desktopIcons = useStore((s) => s.desktopIcons)
  const openWindow = useStore((s) => s.openWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const focusWindow = useStore((s) => s.focusWindow)
  const focusStack = useStore((s) => s.focusStack)
  const windows = useStore((s) => s.windows)
  

  const openApp = (appKey: AppId) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = 600
    const height = 420
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

  const openAboutThisMac = () => {
    const winId = `about-${Math.random().toString(36).slice(2)}`
    openWindow({
      id: winId,
      appKey: "about" as any,
      x: 0,
      y: 0,
      width: 420,
      height: 360,
      minimized: false,
      zoomed: false,
    })
    focusWindow(winId)
  }

  const activeWinId = focusStack[focusStack.length - 1]
  const activeWin = activeWinId ? windows[activeWinId] : null
  const activeAppKey = activeWin?.appKey ?? null

  const activeAppMeta =
    activeAppKey && (activeAppKey as string) !== "about"
      ? apps[activeAppKey as AppId]
      : null

  const activeAppTitle = useMemo(() => {
    if (!activeAppKey) return "Finder"
    if ((activeAppKey as string) === "about") return "Finder"
    return apps[activeAppKey as AppId]?.title ?? "Finder"
  }, [activeAppKey, apps])

  const appMenus: AppMenus =
  (activeAppKey && appsMenus[activeAppKey]) || finderMenus

  // 🔑 Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey) return

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault()
          openApp("finder" as AppId)
          break
        case "w":
          e.preventDefault()
          if (activeWinId) closeWindow(activeWinId)
          break
        case "c":
          e.preventDefault()
          console.log("Copy action (placeholder)")
          break
        case "v":
          e.preventDefault()
          console.log("Paste action (placeholder)")
          break
        case "q":
          e.preventDefault()
          if (activeAppKey) {
            Object.values(windows).forEach((w) => {
              if (w.appKey === activeAppKey) closeWindow(w.id)
            })
          }
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeWinId, activeAppKey, windows, closeWindow])

  return (
    <div
  className="fixed top-0 left-0 right-0 h-[22px] flex items-center justify-between 
             px-2 sm:px-3 md:px-4 text-[11px] sm:text-[12px] md:text-[13px] 
             text-black z-[9999] select-none font-[system-ui]
             backdrop-blur-[2px]"

  style={{
    backgroundImage: `
      linear-gradient(to bottom, #fefefe, #d0d0d0),
      repeating-linear-gradient(
        90deg,
        rgba(255,255,255,0.25) 0px,
        rgba(0,0,0,0.05) 1px,
        transparent 2px
      )
    `,
    backgroundSize: "auto, 140px",
    borderBottom: "1px solid #8d8d8d",
    boxShadow: `
      inset 0 1px rgba(255,255,255,0.7),
      0 1px 2px rgba(0,0,0,0.25)
    `,
  }}
>

      {/* ---------- Left Side Menus ---------- */}
      <div className="flex items-center gap-2">
        {/* Apple menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="flex items-center px-1 hover:bg-black/10 rounded-sm"
            >
              <img src="/apple.png" alt="Apple" className="w-[24px] h-[24px]" />
            </motion.button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
           className="z-[9999] bg-white/95 text-black rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.25)] border border-white/60 backdrop-blur-md p-1.5 min-w-[220px] sm:min-w-[240px] transition-all duration-150"
            sideOffset={4}
          >
            <MenuItem onClick={openAboutThisMac}>About This Mac</MenuItem>
            <DropdownMenu.Separator className="my-1 h-px bg-gray-300" />
            {Object.values(apps).map((app) => {
              const icon = desktopIcons.find((i) => i.id === app.id)
              return (
                <MenuItem
                  key={app.id}
                  onClick={() => openApp(app.id as AppId)}
                  iconRenderer={
                    icon ? (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <AppIconRenderer icon={icon} size="list" />
                      </div>
                    ) : null
                  }
                >
                  {app.title}
                </MenuItem>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {/* Dynamic app menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-1 hover:bg-black/10 rounded-sm font-semibold"
            >
              {activeAppTitle}
            </motion.button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className="bg-white text-black rounded-md shadow-lg p-1 min-w-[180px]"
            sideOffset={4}
          >
            {activeAppMeta ? (
              <>
                <MenuItem onClick={() => openAboutApp(activeWin!.appKey as AppId)}>
                  About {activeAppMeta.title}
                </MenuItem>
                <DropdownMenu.Separator className="my-1 h-px bg-gray-300" />
                <MenuItem>Preferences…</MenuItem>
                <MenuItem>Close</MenuItem>
              </>
            ) : (
              <>
                <MenuItem onClick={() => openAboutApp("finder" as AppId)}>
                  About Finder
                </MenuItem>
                <DropdownMenu.Separator className="my-1 h-px bg-gray-300" />
                <MenuItem>Preferences…</MenuItem>
                <MenuItem>Empty Trash</MenuItem>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {/* Finder-style menus */}
{(Object.entries(appMenus) as [string, MenuItemEntry[]][]).map(([menuName, items]) => (
  <DropdownMenu.Root key={menuName}>
    <DropdownMenu.Trigger asChild>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="px-1 hover:bg-black/10 rounded-sm"
      >
        {menuName}
      </motion.button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
      className="bg-white text-black rounded-md shadow-lg p-1 min-w-[200px]"
      sideOffset={4}
    >
      {items.map((item, i) =>
        item.type === "separator" ? (
          <DropdownMenu.Separator
            key={i}
            className="my-1 h-px bg-gray-300"
          />
        ) : (
          <DropdownMenu.Item
            key={i}
            disabled={item.disabled}
            className={`flex justify-between px-3 py-1.5 text-[13px] ${
              item.disabled
                ? "text-gray-400 pointer-events-none"
                : "cursor-pointer hover:bg-blue-600 hover:text-white"
            }`}
          >
            {item.label}
            {item.shortcut && (
              <span className="ml-6 text-gray-500">{item.shortcut}</span>
            )}
          </DropdownMenu.Item>
        )
      )}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
))}

      </div>

     {/* ---------- Right Side Cluster ---------- */}
<div className="flex items-center gap-1 pr-2">
  {/* Wi-Fi */}
  <Popover.Root>
    <Popover.Trigger asChild>
      <motion.button
        whileTap={{ scale: 0.9 }}
        aria-label="Network"
        className="px-1 hover:bg-black/10 rounded-sm"
      >
        {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      </motion.button>
    </Popover.Trigger>
    <Popover.Content
      sideOffset={4}
      className="z-50 rounded-md border bg-white p-2 shadow-lg text-sm text-black w-56"
    >
      <div className="font-semibold mb-1 flex justify-between">
        AirPort
        <span className="text-blue-600 cursor-pointer">
          Turn {online ? "AirPort Off" : "AirPort On"}
        </span>
      </div>
      {["Home-5G", "CafeNet", "TigerLAN"].map((ssid) => (
        <div
          key={ssid}
          className={`flex justify-between items-center px-2 py-1 rounded-sm cursor-pointer hover:bg-gray-100 ${
            ssid === "Home-5G" ? "font-semibold text-blue-600" : ""
          }`}
        >
          {ssid}
          {ssid === "Home-5G" && <span>✓</span>}
        </div>
      ))}
      <DropdownMenu.Separator className="my-1 h-px bg-gray-300" />
      <div className="px-2 py-1 text-blue-600 cursor-pointer hover:underline">
        Open Network Preferences…
      </div>
    </Popover.Content>
  </Popover.Root>

  {/* Battery */}
  {batterySupported && battery && (
    <Popover.Root>
      <Popover.Trigger asChild>
        <motion.button
          whileTap={{ scale: 0.9 }}
          aria-label="Battery"
          className="px-1 hover:bg-black/10 rounded-sm"
        >
          {battery.charging ? <BatteryCharging size={13} /> : <Battery size={13} />}
        </motion.button>
      </Popover.Trigger>
      <Popover.Content
        sideOffset={4}
        className="z-50 rounded-md border bg-white p-2 shadow-lg text-sm text-black w-56"
      >
        <div className="font-semibold mb-1">Battery</div>
        <div>Charge: {Math.round(battery.level * 100)}%</div>
        <div>
          Status:{" "}
          {battery.charging ? (
            <span className="text-green-600">Charging</span>
          ) : (
            <span className="text-red-600">On Battery</span>
          )}
        </div>
        {!battery.charging && battery.dischargingTime !== undefined && (
          <div className="text-gray-600 text-xs mt-1">
            Time remaining:{" "}
            {battery.dischargingTime === Infinity
              ? "Calculating…"
              : `~${Math.round(battery.dischargingTime / 60)} min`}
          </div>
        )}
        <DropdownMenu.Separator className="my-1 h-px bg-gray-300" />
        <div className="px-2 py-1 text-blue-600 cursor-pointer hover:underline">
          Show Percentage
        </div>
      </Popover.Content>
    </Popover.Root>
  )}

  {/* Sound */}
  <Popover.Root>
    <Popover.Trigger asChild>
      <motion.button
        whileTap={{ scale: 0.9 }}
        aria-label="Sound"
        className="px-1 hover:bg-black/10 rounded-sm"
      >
        {prefs.soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
      </motion.button>
    </Popover.Trigger>
    <Popover.Content
      sideOffset={4}
      className="z-50 rounded-md border bg-white p-2 shadow-lg text-sm text-black w-56"
    >
      <div className="font-semibold mb-1">Output</div>
      {["MacBook Speakers", "Headphones"].map((out) => (
        <div
          key={out}
          className={`flex justify-between px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            out === "MacBook Speakers" ? "font-semibold text-blue-600" : ""
          }`}
        >
          {out} {out === "MacBook Speakers" && <span>✓</span>}
        </div>
      ))}
      <DropdownMenu.Separator className="my-1 h-px bg-gray-300" />
      <label className="block text-xs text-gray-600 mb-1">Volume</label>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(prefs.volume * 100)}
        onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
        className="w-full accent-blue-600"
      />
      <div className="mt-2 text-blue-600 cursor-pointer hover:underline">
        Sound Preferences…
      </div>
    </Popover.Content>
  </Popover.Root>

  {/* Clock */}
  <Popover.Root>
    <Popover.Trigger asChild>
      <motion.button
        whileTap={{ scale: 0.95 }}
        aria-label="Clock"
        className="px-1 hover:bg-black/10 rounded-sm tabular-nums font-medium"
      >
        {label}
      </motion.button>
    </Popover.Trigger>
    <Popover.Content
      sideOffset={4}
      className="z-50 rounded-md border bg-white p-3 shadow-lg text-sm text-black w-64"
    >
      <div className="text-center font-semibold mb-2">
        {new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-gray-500 text-center">
            {d}
          </div>
        ))}
        {Array.from(
          { length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() },
          (_, i) => i + 1
        ).map((day) => (
          <div
            key={day}
            className={`text-center py-1 rounded-sm ${
              day === new Date().getDate()
                ? "bg-blue-600 text-white font-bold"
                : "hover:bg-gray-100 cursor-pointer"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 text-blue-600 cursor-pointer hover:underline text-center">
        Open Date & Time Preferences…
      </div>
    </Popover.Content>
  </Popover.Root>
</div>
    </div>
  )
}
