import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { motion, useSpring, animate } from "framer-motion"
import { useStore } from "../store"
import type { AppIcon } from "../store/apps"
import { AppIconRenderer } from "./AppIconRenderer"
import { playSystemSound } from "../store/sounds"

const TRASH_EMPTY_ICON = "/icons/trash.png"
const TRASH_FULL_ICON = "/icons/trash-full.png"

// Dock scaling constants
const BASE_SIZE = 44
const MAX_SCALE = 2.4
const INFLUENCE = 90
const LIFT_HEIGHT = 36
const SPRING_CONFIG = { stiffness: 400, damping: 28, mass: 0.8 }

type DockItemProps = {
  icon: AppIcon
  minimized?: boolean
  winId?: string
  onClick: () => void
  mouseX: number | null
  scaleFactor: number
}

function DockItem({ icon, minimized, winId, onClick, mouseX, scaleFactor }: DockItemProps) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const setDockIconPosition = useStore((s) => s.setDockIconPosition)
  const [centerX, setCenterX] = useState(0)

  const scale = useSpring(1, SPRING_CONFIG)
  const y = useSpring(0, SPRING_CONFIG)
  const dotScale = useSpring(1, SPRING_CONFIG)
  const dotY = useSpring(0, SPRING_CONFIG)

  const updatePosition = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    setCenterX(cx)
    setDockIconPosition(icon.id, { x: cx, y: rect.top + rect.height / 2 })
  }, [icon.id, setDockIconPosition])

  useEffect(() => {
    updatePosition()
    window.addEventListener("resize", updatePosition)
    const ro = new ResizeObserver(updatePosition)
    if (ref.current) ro.observe(ref.current)
    return () => {
      window.removeEventListener("resize", updatePosition)
      ro.disconnect()
    }
  }, [updatePosition])

  // Hover magnification
  useEffect(() => {
    const distance = mouseX !== null ? Math.abs(mouseX - centerX) : Infinity
    let strength = 0
    if (distance < INFLUENCE) {
      const normalized = distance / INFLUENCE
      strength = Math.cos(normalized * (Math.PI / 2))
      strength = Math.pow(strength, 3)
    }
    const targetScale = 1 + (MAX_SCALE - 1) * strength
    const targetY = -LIFT_HEIGHT * strength
    scale.set(targetScale)
    y.set(targetY)
    dotScale.set(1 + 0.8 * strength)
    dotY.set(-6 * strength)
  }, [mouseX, centerX, scale, y, dotScale, dotY])

  const handleClick = () => {
    if (!winId) {
      animate(scale, [1, 1.4, 0.9, 1.1, 1], { duration: 0.6, ease: "easeOut" })
      playSystemSound("appOpen")
    } else playSystemSound("focus")
    onClick()
  }

  return (
    <motion.div className="relative flex flex-col items-center" style={{ y }}>
      <motion.button
        ref={ref}
        title={icon.title}
        aria-label={`Open ${icon.title}`}
        onClick={handleClick}
        style={{
          width: BASE_SIZE * scaleFactor,
          height: BASE_SIZE * scaleFactor,
          scale,
        }}
        className="relative focus:outline-none touch-manipulation"
        whileTap={{ scale: 0.95 }}
      >
        <AppIconRenderer icon={icon} size="dock" />
        {winId && (
          <motion.div
            layoutId={`dot-${icon.id}`}
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 
                        w-1.5 h-1.5 rounded-full ${
                          minimized ? "bg-orange-400" : "bg-blue-500"
                        }`}
            style={{ scale: dotScale, y: dotY }}
            animate={minimized ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
            transition={
              minimized
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : { type: "spring", stiffness: 300, damping: 25 }
            }
          />
        )}
      </motion.button>
    </motion.div>
  )
}

export default function Dock() {
  const icons = useStore((s) => s.desktopIcons)
  const windows = useStore((s) => s.windows)
  const restoreWindow = useStore((s) => s.restoreWindow)
  const focusWindow = useStore((s) => s.focusWindow)
  const trash = useStore((s) => s.trash)

  const [mouseX, setMouseX] = useState<number | null>(null)
  const pinned = useMemo(() => icons.filter((i) => i.pinned), [icons])

  const running = useMemo(() => {
    return Object.values(windows)
      .map((win) => {
        const icon = icons.find((i) => i.id === win.appKey)
        if (!icon) return null
        return { icon, minimized: win.minimized, winId: win.id }
      })
      .filter(Boolean) as { icon: AppIcon; minimized: boolean; winId: string }[]
  }, [windows, icons])

  const dockItems = useMemo(() => {
    const map = new Map<string, { icon: AppIcon; minimized?: boolean; winId?: string }>()
    pinned.forEach((p) => map.set(p.id, { icon: p }))
    running.forEach((r) =>
      map.set(r.icon.id, { icon: r.icon, minimized: r.minimized, winId: r.winId })
    )
    return Array.from(map.values())
  }, [pinned, running])

  const trashIcon: AppIcon = {
    id: "trash" as any,
    title: "Trash",
    iconUrl: trash.length === 0 ? TRASH_EMPTY_ICON : TRASH_FULL_ICON,
    launch: () => {
      playSystemSound("trash")
      const finder = icons.find((i) => i.id === "finder")
      finder?.launch({ path: ["Trash"] })
    },
    pinned: false,
    x: 0,
    y: 0,
  }

  // 🧩 Auto scale factor based on total items and screen width
  const scaleFactor = useMemo(() => {
    const count = dockItems.length + 1 // +1 for Trash
    const screenWidth = window.innerWidth
    const maxDockWidth = Math.min(screenWidth * 0.9, 680)
    const idealIconSize = BASE_SIZE * 1.5
    const totalIdeal = count * idealIconSize
    return totalIdeal > maxDockWidth
      ? Math.max(0.7, maxDockWidth / totalIdeal)
      : 1
  }, [dockItems.length])

  return (
    <motion.nav
      aria-label="Dock"
      className="
        fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 
        flex flex-row gap-2 sm:gap-4 px-3 sm:px-6 
        items-end rounded-2xl border border-gray-300/40 shadow-lg 
        select-none z-50 justify-center py-1 sm:py-2
        w-[94vw] sm:w-auto max-w-[min(100%,680px)]
        bg-[rgba(255,255,255,0.35)] backdrop-blur-md
        dark:bg-[rgba(40,40,40,0.35)] dark:border-gray-600/40
        transition-all duration-300 ease-out
      "
      onMouseMove={(e) => setMouseX(e.clientX)}
      onMouseLeave={() => setMouseX(null)}
    >
      {dockItems.map(({ icon, minimized, winId }) => (
        <DockItem
          key={icon.id}
          icon={icon}
          minimized={minimized}
          winId={winId}
          mouseX={mouseX}
          onClick={() => {
            if (winId) minimized ? restoreWindow(winId) : focusWindow(winId)
            else icon.launch()
          }}
          scaleFactor={scaleFactor}
        />
      ))}
      <DockItem
        key="trash"
        icon={trashIcon}
        minimized={false}
        mouseX={mouseX}
        onClick={trashIcon.launch}
        scaleFactor={scaleFactor}
      />
    </motion.nav>
  )
}
