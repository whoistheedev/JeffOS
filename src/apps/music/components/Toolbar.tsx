import React, { useState } from "react"
import { motion } from "framer-motion"
import { Search, SkipBack, SkipForward, Play, Pause } from "lucide-react"
import { brushedMetalBar, tigerFont } from "../../../lib/aquaSkin"

interface ToolbarProps {
  track?: any
  isPlaying?: boolean
  progress?: number
  duration?: number
  onPlayPause?: () => void
  onNext?: () => void
  onPrev?: () => void
  onSeek?: (ms: number) => void
}

/**
 * iTunes (Tiger era) top chrome: round Aqua transport buttons on the left, the
 * iconic rounded LCD "now playing" display in the center, and a capsule search
 * on the right — all on a brushed-metal bar. See aquaSkin.ts / TIGER_AUTHENTICITY.
 */
export function Toolbar({
  track,
  isPlaying = false,
  progress = 0,
  duration = 0,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
}: ToolbarProps) {
  const [search, setSearch] = useState("")

  return (
    <div
      className="flex items-center gap-3 px-3 h-[58px] select-none relative z-10"
      style={{ ...brushedMetalBar, fontFamily: tigerFont }}
    >
      {/* Left: round Aqua transport */}
      <div className="flex items-center gap-2">
        <TransportButton aria="Previous" onClick={onPrev}>
          <SkipBack size={13} fill="currentColor" />
        </TransportButton>
        <TransportButton aria={isPlaying ? "Pause" : "Play"} large onClick={onPlayPause}>
          {isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-[1px]" />
          )}
        </TransportButton>
        <TransportButton aria="Next" onClick={onNext}>
          <SkipForward size={13} fill="currentColor" />
        </TransportButton>
      </div>

      {/* Center: the iconic LCD now-playing display */}
      <LcdDisplay
        track={track}
        progress={progress}
        duration={duration}
        onSeek={onSeek}
      />

      {/* Right: capsule search */}
      <motion.div
        className="flex items-center relative shrink-0"
        animate={{ width: search ? 170 : 140 }}
        transition={{ duration: 0.2 }}
        style={{
          background: "linear-gradient(180deg,#fcfcfc 0%,#dcdcdc 100%)",
          border: "1px solid #8a8a8a",
          borderRadius: 999,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2), inset 0 1px rgba(255,255,255,0.9)",
        }}
      >
        <Search size={12} className="absolute left-2 text-neutral-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="pl-6 pr-3 py-[3px] w-full bg-transparent text-[11.5px] text-[#222] placeholder:text-neutral-500 focus:outline-none rounded-full"
          style={{ fontFamily: tigerFont }}
        />
      </motion.div>
    </div>
  )
}

/* ---------- LCD now-playing display ---------- */
function LcdDisplay({
  track,
  progress,
  duration,
  onSeek,
}: {
  track?: any
  progress: number
  duration: number
  onSeek?: (ms: number) => void
}) {
  const pct = duration ? Math.min((progress / duration) * 100, 100) : 0
  const remaining = duration ? duration - progress : 0

  return (
    <div
      className="flex-1 min-w-0 h-[42px] flex items-center px-3 gap-3 relative overflow-hidden"
      style={{
        // Pale Aqua-LCD: soft blue-grey glass with an inset bezel + top sheen.
        background: "linear-gradient(180deg,#eef3f7 0%,#dde6ee 50%,#e7eef4 100%)",
        borderRadius: 8,
        border: "1px solid #9aa6b2",
        boxShadow:
          "inset 0 2px 4px rgba(60,80,110,0.25), inset 0 -1px 0 rgba(255,255,255,0.8), 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* glass top sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.55),transparent)" }}
      />
      {track?.album?.images?.[0]?.url && (
        <img
          src={track.album.images[track.album.images.length - 1]?.url || track.album.images[0].url}
          alt=""
          className="w-8 h-8 rounded-[2px] border border-[#9aa6b2] shrink-0 relative z-10"
        />
      )}

      <div className="flex-1 min-w-0 relative z-10 text-center">
        {track ? (
          <>
            <div className="truncate text-[12px] font-semibold text-[#1f2d3d] leading-tight">
              {track.name}
            </div>
            <div className="truncate text-[10.5px] text-[#4a5a6b] leading-tight">
              {track.artists?.map((a: any) => a.name).join(", ")}
            </div>
            {/* thin scrubber */}
            <div
              className="mt-[3px] h-[4px] rounded-full relative cursor-pointer mx-auto w-[88%]"
              style={{
                background: "linear-gradient(180deg,#b9c4d0,#cdd6e0)",
                boxShadow: "inset 0 1px 1px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => {
                if (!onSeek || !duration) return
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                onSeek(((e.clientX - rect.left) / rect.width) * duration)
              }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(180deg,#7fb6ff,#2f86e0)",
                  boxShadow: "inset 0 1px rgba(255,255,255,0.6)",
                }}
              />
            </div>
          </>
        ) : (
          <div className="text-[12px] text-[#6a7a8b] tracking-wide">iTunes</div>
        )}
      </div>

      {track && (
        <div className="text-[10px] tabular-nums text-[#4a5a6b] shrink-0 relative z-10 text-right leading-tight">
          <div>{fmt(progress)}</div>
          <div className="opacity-70">-{fmt(remaining)}</div>
        </div>
      )}
    </div>
  )
}

/* ---------- Round Aqua transport button ---------- */
function TransportButton({
  children,
  onClick,
  aria,
  large = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  aria: string
  large?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ filter: "brightness(1.06)" }}
      onClick={onClick}
      aria-label={aria}
      className="flex items-center justify-center rounded-full text-[#3a4655]"
      style={{
        width: large ? 32 : 26,
        height: large ? 32 : 26,
        background: "linear-gradient(180deg,#ffffff 0%,#e3e8ee 48%,#cdd5de 52%,#dde3ea 100%)",
        border: "1px solid #8e98a4",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 1px rgba(0,0,0,0.2)",
      }}
    >
      {children}
    </motion.button>
  )
}

function fmt(ms: number) {
  if (!ms || ms < 0) return "0:00"
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
}
