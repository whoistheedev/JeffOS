import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as Popover from "@radix-ui/react-popover"
import { type ThemeId } from "../../config/holidays"
import { useStore } from "../../store"
import { Button } from "../../components/ui/button"
import { supabase } from "../../lib/supabase"

/* -------------------------------------------------------------------------- */
/* 📅 macOS X Tiger-style Holiday Calendar                                   */
/* -------------------------------------------------------------------------- */
export default function HolidayCalendar() {
  const today = new Date()
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [holidays, setHolidays] = useState<any[]>([])
  const [toast, setToast] = useState("")
  const [popoverOpen, setPopoverOpen] = useState(false)

  const applyHolidayTheme = useStore((s) => s.applyHolidayTheme)
  const clearHolidayTheme = useStore((s) => s.clearHolidayTheme)
  const recompute = useStore((s) => s.recomputeAutoHoliday)
  const activeTheme = useStore((s) => s.prefs.holidayThemeOverride)

  /* ☁️ Load holidays */
  useEffect(() => {
    supabase
      .from("calendar_holidays")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setHolidays(data)
      })
  }, [])

  /* 📅 Build month grid */
  const grid = useMemo(() => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const days: Date[] = []
    const lead = (start.getDay() + 6) % 7
    for (let i = 0; i < lead; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() - (lead - i))
      days.push(d)
    }
    for (let d = 1; d <= end.getDate(); d++) {
      days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    }
    while (days.length % 7 !== 0) {
      const d = new Date(end)
      d.setDate(d.getDate() + 1)
      days.push(d)
    }
    return days
  }, [cursor])

  /* 🎨 Theme actions */
  async function broadcastTheme(themeId: ThemeId | null) {
    await supabase.channel("theme-sync").send({
      type: "broadcast",
      event: "theme_change",
      payload: { themeId },
    })
  }

  async function handleApply(themeId: ThemeId, name: string) {
    await broadcastTheme(themeId)
    applyHolidayTheme(themeId)
    setToast(`Applied “${name}” theme`)
    setTimeout(() => setToast(""), 2200)
  }

  async function handleReset() {
    await broadcastTheme(null)
    clearHolidayTheme()
    setToast("Restored default look")
    setTimeout(() => setToast(""), 2200)
  }

  /* ---------------------------------------------------------------------- */
  /* 💻 Render                                                              */
  /* ---------------------------------------------------------------------- */
  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden select-none 
      bg-gradient-to-b from-[#f4f4f6] to-[#c7c9cc] border border-gray-300 
      rounded-xl backdrop-blur-sm shadow-inner"
      style={{
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 8px rgba(0,0,0,0.25)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <h2 className="text-base font-semibold text-neutral-800 tracking-tight">
          {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            ‹
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
            }
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            ›
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden px-4 pb-3">
        <div className="grid grid-cols-7 text-xs font-medium text-neutral-600 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-[3px] h-full"
          style={{ gridAutoRows: "1fr" }}
        >
          {grid.map((d, i) => {
            const isCurrent = d.getMonth() === cursor.getMonth()
            const isToday =
              d.getDate() === today.getDate() &&
              d.getMonth() === today.getMonth() &&
              d.getFullYear() === today.getFullYear()
            const holiday = holidays.find(
              (h) => new Date(h.date).toDateString() === d.toDateString()
            )
            const themeId = holiday?.theme_id as ThemeId | null
            const accent = holiday?.accent || "#007aff"

            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative p-2 border rounded-md 
                bg-white/70 hover:bg-white/90 backdrop-blur-sm 
                flex flex-col justify-between items-center transition-all
                ${!isCurrent ? "opacity-40" : ""}`}
              >
                {/* Halo highlight */}
                {holiday && (
                  <div
                    className="absolute inset-0 rounded-md pointer-events-none"
                    style={{
                      boxShadow: `0 0 0 2px ${accent}33 inset, 0 0 8px ${accent}40`,
                    }}
                  />
                )}

                {/* Top pulse indicator */}
                {holiday && (
                  <motion.div
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-sm"
                    style={{
                      backgroundColor: accent,
                      boxShadow: `0 0 6px ${accent}66`,
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.9, 1, 0.9],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Date + holiday label */}
                <div className="flex flex-col items-center mt-2 z-10">
                  <span
                    className={`text-sm leading-none ${
                      isToday ? "font-bold text-blue-700" : "text-neutral-800"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {holiday && (
                    <span
                      className="text-[10px] mt-1 px-1 py-0.5 rounded font-semibold truncate"
                      style={{
                        backgroundColor: `${accent}15`,
                        color: accent,
                      }}
                    >
                      {holiday.name}
                    </span>
                  )}
                </div>

                {/* Apply button */}
                {holiday && (
                  <div className="flex justify-end mt-1 z-10 w-full">
                    <Button
                      size="sm"
                      className="text-[10px] h-5 px-2 ml-auto"
                      onClick={() => handleApply(themeId!, holiday.name)}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-white/30 shrink-0 text-sm relative">
        <span>
          Current Look:&nbsp;
          <strong className="text-blue-700">{activeTheme || "Default"}</strong>
        </span>

        <div className="flex gap-2 items-center">
          <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger asChild>
              <Button size="sm" variant="secondary">
                🎉 Holiday Themes
              </Button>
            </Popover.Trigger>
            <Popover.Portal>
              <AnimatePresence>
                {popoverOpen && (
                  <Popover.Content
                    asChild
                    sideOffset={8}
                    align="end"
                    collisionPadding={16}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.25 }}
                      className="z-[9999] w-60 rounded-xl border border-white/30 
                        bg-white/80 backdrop-blur-md shadow-lg p-2 select-none"
                    >
                      <div className="text-xs font-medium mb-1 text-neutral-700">
                        Available Holidays
                      </div>
                      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                        {holidays.length === 0 && (
                          <div className="text-xs text-neutral-500 py-2 text-center">
                            No holidays loaded
                          </div>
                        )}
                        {holidays.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => {
                              handleApply(h.theme_id, h.name)
                              setPopoverOpen(false)
                            }}
                            className="flex justify-between items-center text-sm 
                              px-2 py-1.5 rounded-md hover:bg-white/70 transition-colors"
                          >
                            <span>{h.name}</span>
                            <span
                              className="w-3 h-3 rounded-full border border-white/40"
                              style={{ backgroundColor: h.accent || "#ccc" }}
                            />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </Popover.Content>
                )}
              </AnimatePresence>
            </Popover.Portal>
          </Popover.Root>

          <Button variant="outline" size="sm" onClick={() => recompute()}>
            Smart Select
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset}>
            Restore
          </Button>
        </div>
      </div>

      {/* Floating Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 
              px-4 py-1.5 bg-blue-600/90 text-white text-xs font-medium 
              rounded-full shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
