import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Dashboard (Tiger 10.4): F12 overlays a dark translucent layer with widgets
 * that "ripple" in; F12/Esc/click dismisses. Includes a few real Tiger-era
 * widgets — Clock, Calculator, and a Calendar. Mounted in DesktopShell.
 */
function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="rounded-2xl p-4 text-white"
      style={{
        background: "linear-gradient(to bottom, rgba(40,44,52,0.92), rgba(22,24,30,0.92))",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
        minWidth: 180,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/55">{title}</div>
      {children}
    </motion.div>
  )
}

function ClockWidget() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-center">
      <div className="font-mono text-3xl tabular-nums">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="mt-1 text-xs text-white/60">
        {now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
      </div>
    </div>
  )
}

function CalculatorWidget() {
  const [expr, setExpr] = useState("")
  const [out, setOut] = useState("0")
  const press = (k: string) => {
    if (k === "C") { setExpr(""); setOut("0"); return }
    if (k === "=") {
      try {
        // safe-ish: digits/operators only
        if (/^[0-9+\-*/.() ]+$/.test(expr)) {
          // eslint-disable-next-line no-new-func
          const v = Function(`"use strict";return (${expr})`)()
          setOut(String(v))
        }
      } catch { setOut("Error") }
      return
    }
    setExpr((e) => e + k)
  }
  const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C"]
  return (
    <div style={{ width: 180 }}>
      <div className="mb-2 rounded bg-black/40 px-2 py-1 text-right font-mono text-lg">{out}</div>
      <div className="grid grid-cols-4 gap-1">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`rounded py-1.5 text-sm ${k === "C" ? "col-span-4 bg-white/15" : "bg-white/10"} hover:bg-white/20`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

function CalendarWidget() {
  const now = new Date()
  return (
    <div className="text-center">
      <div className="rounded-t bg-red-600 px-3 py-0.5 text-[10px] font-bold uppercase">
        {now.toLocaleDateString([], { month: "short" })}
      </div>
      <div className="rounded-b bg-white px-3 py-2 text-4xl font-bold text-black">{now.getDate()}</div>
    </div>
  )
}

export default function Dashboard() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F12") { e.preventDefault(); setOpen((o) => !o) }
      else if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[5600] flex flex-wrap content-start gap-6 p-12"
          style={{ background: "rgba(10,16,28,0.45)", backdropFilter: "blur(6px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label="Dashboard"
        >
          <Widget title="Clock"><ClockWidget /></Widget>
          <Widget title="Calculator"><CalculatorWidget /></Widget>
          <Widget title="Calendar"><CalendarWidget /></Widget>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
