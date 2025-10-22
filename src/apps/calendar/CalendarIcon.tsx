import { useEffect, useState } from "react"
import { useStore } from "../../store"
import { THEME_PACKS } from "../../config/themes"

type CalendarIconProps = {
  size?: "desktop" | "list" | "column"
}

export default function CalendarIcon({ size = "desktop" }: CalendarIconProps) {
  const [today, setToday] = useState(new Date())
  const activeTheme = useStore((s) => s.activeTheme)
  const theme = THEME_PACKS[activeTheme]

  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const day = today.getDate()
  const month = today.toLocaleString("en-US", { month: "short" }) // e.g. Sep

  // wrapper + base font-size
  let wrapperClass = "relative flex items-center justify-center"
  let sizeStyle: React.CSSProperties = { width: 64, height: 64, fontSize: 16 } // desktop default

  if (size === "list" || size === "column") {
    sizeStyle = { width: 20, height: 20, fontSize: 5 }
  }

  return (
    <div className={wrapperClass} style={sizeStyle}>
      {/* base calendar image */}
      <img
        src="/icons/calendar.png"
        alt="Calendar"
        className="w-full h-full object-contain"
      />

      {/* overlay month */}
      <div className="absolute top-[12%] left-1/4 -translate-x-1/2">
        <span className="text-[0.4em] font-bold uppercase tracking-wide text-white drop-shadow">
          {month}
        </span>
      </div>

      {/* overlay day */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2">
        <span className="text-[1.2em] font-bold leading-none drop-shadow text-black">
          {day}
        </span>
      </div>
    </div>
  )
}
