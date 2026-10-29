import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence, useSpring, animate } from "framer-motion"
import { tigerFont } from "../lib/aquaSkin"
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
  // True when the cursor is essentially over THIS icon — drives the Aqua
  // name-tag bubble (Tiger shows the app name above the hovered icon).
  const [showLabel, setShowLabel] = useState(false)

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
    // Show the name-tag once the cursor is right over this icon.
    setShowLabel(distance < BASE_SIZE * 0.6)
  }, [mouseX, centerX, scale, y, dotScale, dotY])

  const handleClick = () => {
    if (!winId) {
      // Classic Tiger launch bounce: the icon hops up and down a few times
      // while the app opens (decaying jumps), not a single scale pop.
      animate(y.get(), [0, -22, 0, -14, 0, -7, 0], {
        duration: 0.9,
        ease: "easeOut",
        onUpdate: (v) => y.set(v),
      })
      playSystemSound("appOpen")
    } else playSystemSound("focus")
    onClick()
  }

  return (
    <motion.div className="relative flex flex-col items-center" style={{ y }}>
      {/* Aqua hover name-tag (Tiger): rounded translucent-black label with a
          little downward arrow, floating above the magnified icon. */}
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
            style={{ bottom: "calc(100% + 14px)" }}
          >
            <div
              className="px-2.5 py-[3px] rounded-[7px] text-[12px] font-medium text-white"
              style={{
                fontFamily: tigerFont,
                background: "rgba(30,30,30,0.82)",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "inset 0 1px rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.4)",
                textShadow: "0 1px 1px rgba(0,0,0,0.6)",
              }}
            >
              {icon.title}
            </div>
            {/* downward arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-[4px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid rgba(30,30,30,0.82)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        ref={ref}
        aria-label={`Open ${icon.title}`}
        onClick={handleClick}
        style={{
          width: BASE_SIZE * scaleFactor,
          height: BASE_SIZE * scaleFactor,
          scale,
        }}
        className="relative focus:outline-none touch-manipulation"
      >
        {/* Tiger glass-floor reflection: a flipped, faded copy that scales with
            the icon's magnification (shares the same motion wrapper). */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-full w-full"
          style={{
            height: "70%",
            transform: "scaleY(-1)",
            opacity: 0.28,
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 75%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 75%)",
          }}
        >
          <AppIconRenderer icon={icon} size="dock" />
        </div>
        <AppIconRenderer icon={icon} size="dock" />
        {/* Tiger running indicator: a small black triangle under the icon,
            not the modern colored dot. (Replaces blue/orange dots.) */}
        {winId && (
          <motion.div
            layoutId={`dot-${icon.id}`}
            className="absolute -bottom-[3px] left-1/2 -translate-x-1/2"
            style={{ scale: dotScale, y: dotY }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            aria-hidden
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderBottom: "5px solid rgba(20,20,20,0.85)",
                filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.45))",
              }}
            />
          </motion.div>
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
        items-end rounded-2xl select-none z-50 justify-center py-1 sm:py-2
        w-[94vw] sm:w-auto max-w-[min(100%,680px)]
        backdrop-blur-xl transition-all duration-300 ease-out
      "
      style={{
        // Tiger Aqua glass shelf: frosted white with a bright top gloss, a
        // subtle reflective lower band, and a glassy front lip — not a flat
        // dark slab. (Stays glassy-white regardless of Recruiter dark mode.)
        background:
          "linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.32) 48%, rgba(225,232,240,0.30) 52%, rgba(255,255,255,0.45) 100%)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.35)",
      }}
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
      {/* Tiger dock separator: a faint vertical pinstripe dividing apps from
          the Trash (the right-hand "documents/trash" region). */}
      <div
        aria-hidden
        className="self-stretch my-1 mx-1"
        style={{
          width: 1,
          background:
            "linear-gradient(to bottom, transparent, rgba(0,0,0,0.18) 30%, rgba(0,0,0,0.18) 70%, transparent)",
          boxShadow: "1px 0 0 rgba(255,255,255,0.5)",
        }}
      />
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
