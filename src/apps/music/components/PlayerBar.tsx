import React from "react"
import { motion } from "framer-motion"
import { cn } from "../../../lib/utils"

interface PlayerBarProps {
  track: any
  isPlaying: boolean
  progress: number
  duration: number
  onPlayPause: () => void
  onNext: () => void
  onPrev: () => void
}

export function PlayerBar({
  track,
  isPlaying,
  progress,
  duration,
  onPlayPause,
  onNext,
  onPrev,
}: PlayerBarProps) {
  const pct = duration ? (progress / duration) * 100 : 0

  return (
    <div
      className={cn(
        "w-full h-[84px] flex flex-col justify-center px-5",
        "bg-[linear-gradient(180deg,#d9d9d9_0%,#bcbcbc_100%)]",
        "dark:bg-[linear-gradient(180deg,#2b2b2b_0%,#171717_100%)]",
        "text-[12.5px] text-black dark:text-neutral-100",
        "font-[Lucida_Grande,system-ui,sans-serif]",
        "select-none relative overflow-hidden"
      )}
      style={{
        boxShadow:
          "inset 0 1px rgba(255,255,255,0.7), inset 0 -1px rgba(0,0,0,0.25)",
      }}
    >
      {!track ? (
        <div className="flex-1 flex items-center justify-center text-neutral-500">
          No track selected
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            {/* Left: Album + titles */}
            <div className="flex items-center gap-3">
              <motion.img
                key={track.id || track.name}
                src={track.album?.images?.[0]?.url}
                alt={track.name}
                className="w-14 h-14 rounded-[2px] shadow-sm border border-[#8d8d8d]/50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
              <div>
                <div className="font-semibold leading-tight text-[13px] truncate max-w-[160px]">
                  {track.name}
                </div>
                <div className="text-[11.5px] text-neutral-600 dark:text-neutral-400 truncate max-w-[160px]">
                  {track.artists.map((a: any) => a.name).join(", ")}
                </div>
              </div>
            </div>

            {/* Center: Playback controls */}
            <div className="flex items-center gap-3">
              <AquaButton onClick={onPrev} icon="⏮" />
              <AquaButton
                onClick={onPlayPause}
                icon={isPlaying ? "⏸" : "▶"}
                active={isPlaying}
              />
              <AquaButton onClick={onNext} icon="⏭" />
            </div>

            {/* Right: timing */}
            <div className="text-[11px] tabular-nums text-neutral-700 dark:text-neutral-300">
              {format(progress)} / {format(duration)}
            </div>
          </div>

          {/* Progress Bar + Waveform pulse */}
          <div
            className="
              h-[6px] mt-1 rounded-full overflow-hidden
              bg-[linear-gradient(180deg,#9b9b9b_0%,#707070_100%)]
              relative
            "
          >
            <motion.div
              className="
                absolute h-full rounded-full
                bg-[linear-gradient(180deg,#5cb4ff_0%,#1a79ff_100%)]
                shadow-[inset_0_1px_rgba(255,255,255,0.5)]
              "
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ ease: "linear", duration: 0.25 }}
            />
            {isPlaying && (
              <motion.div
                className="absolute inset-0 opacity-40 bg-[url('/waveform.svg')] bg-repeat-x bg-[length:120px_6px]"
                animate={{ backgroundPositionX: ["0%", "100%"] }}
                transition={{
                  repeat: Infinity,
                  ease: "linear",
                  duration: 2.8,
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Helpers ---------- */

function format(ms: number) {
  if (!ms) return "0:00"
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}

function AquaButton({
  icon,
  onClick,
  active = false,
}: {
  icon: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className={cn(
        "w-7 h-7 flex items-center justify-center text-[14px] font-bold rounded-full",
        "border border-[#7f7f7f]/60 shadow-[inset_0_1px_rgba(255,255,255,0.8)]",
        "transition-all duration-150",
        active
          ? "bg-[linear-gradient(180deg,#4da3ff_0%,#006aff_100%)] text-white shadow-[0_0_6px_rgba(0,120,255,0.8)]"
          : "bg-[linear-gradient(180deg,#f5f5f5_0%,#cfcfcf_100%)] hover:bg-[linear-gradient(180deg,#ffffff_0%,#dcdcdc_100%)] text-black"
      )}
    >
      {icon}
    </motion.button>
  )
}
