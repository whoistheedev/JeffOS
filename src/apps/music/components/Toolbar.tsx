import React, { useState } from "react"
import { motion } from "framer-motion"
import { Search, ListMusic, Grid3X3, HardDrive } from "lucide-react"

export function Toolbar() {
  const [view, setView] = useState<"list" | "grid" | "devices">("list")
  const [search, setSearch] = useState("")

  return (
    <div
      className="
        flex items-center justify-between px-3
        h-[44px]
        text-[12px] font-[Lucida_Grande,system-ui,sans-serif]
        bg-[linear-gradient(180deg,#ededed_0%,#c8c8c8_100%)]
        dark:bg-[linear-gradient(180deg,#222_0%,#111_100%)]
        border-b border-[#8c8c8c]/60
        [box-shadow:inset_0_1px_rgba(255,255,255,0.6),inset_0_-1px_rgba(0,0,0,0.25)]
        select-none relative z-10
      "
    >
      {/* Left: App title + segmented controls */}
      <div className="flex items-center gap-2">
        <div
          className="
            relative text-[13px] font-semibold text-[#2b2b2b] dark:text-neutral-100
            drop-shadow-[0_1px_0_white] tracking-wide
          "
        >
          iTunes
          <span className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent opacity-70 [mask-image:radial-gradient(circle_at_30%_40%,white,transparent_70%)]" />
        </div>

        {/* Segmented controls */}
        <div
          className="
            flex items-center ml-3 border border-[#7f7f7f]/60 rounded-[6px]
            shadow-[inset_0_1px_rgba(255,255,255,0.7)]
            overflow-hidden backdrop-blur-[2px]
          "
        >
          <SegmentButton
            icon={<ListMusic size={13} />}
            active={view === "list"}
            onClick={() => setView("list")}
          />
          <SegmentButton
            icon={<Grid3X3 size={13} />}
            active={view === "grid"}
            onClick={() => setView("grid")}
          />
          <SegmentButton
            icon={<HardDrive size={13} />}
            active={view === "devices"}
            onClick={() => setView("devices")}
          />
        </div>
      </div>

      {/* Right: Search */}
      <motion.div
        className="
          flex items-center gap-1 relative
          bg-[linear-gradient(180deg,#fcfcfc_0%,#d8d8d8_100%)]
          border border-[#8a8a8a]/60
          rounded-[4px]
          shadow-[inset_0_1px_rgba(255,255,255,0.8)]
          overflow-hidden
        "
        animate={{ width: search ? 180 : 150 }}
        transition={{ duration: 0.2 }}
      >
        <Search
          size={12}
          className="absolute left-1.5 text-neutral-500 opacity-70 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Library"
          className="
            pl-5 pr-2 py-[3px] w-full
            bg-transparent text-[11.5px] text-[#222]
            placeholder:text-neutral-500
            focus:outline-none
            focus:ring-1 focus:ring-blue-400/60
            rounded-[4px]
          "
        />
      </motion.div>
    </div>
  )
}

/* ---------- Segmented Button ---------- */
function SegmentButton({
  icon,
  active,
  onClick,
}: {
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.06 }}
      className={` 
        w-[28px] h-[23px] flex items-center justify-center
        border-r border-[#7f7f7f]/40 last:border-r-0
        transition-all duration-150
        ${
          active
            ? "bg-[linear-gradient(180deg,#4ea3ff_0%,#1a73ff_100%)] text-white shadow-[inset_0_1px_rgba(255,255,255,0.6),0_0_4px_rgba(50,130,255,0.6)]"
            : "bg-[linear-gradient(180deg,#f6f6f6_0%,#d0d0d0_100%)] hover:bg-[linear-gradient(180deg,#ffffff_0%,#dcdcdc_100%)] text-[#2a2a2a]"
        }
      `}
    >
      {icon}
    </motion.button>
  )
}
