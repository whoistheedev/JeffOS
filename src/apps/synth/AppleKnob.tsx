import React, { useEffect, useCallback } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"

interface KnobProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  size?: number
}

/**
 * AppleKnob — Aqua-era rotary knob
 * • Drag vertically to adjust value.
 * • Glass highlight + inner glow animation.
 * • Smooth 60 fps rotation & light feedback.
 */
export default function AppleKnob({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  size = 72,
}: KnobProps) {
  const rotation = useMotionValue(((value - min) / (max - min)) * 270 - 135)
  const display = useTransform(rotation, (r) =>
    (((r + 135) / 270) * (max - min) + min).toFixed(2)
  )

  // keep rotation synced to external value
  useEffect(() => {
    rotation.set(((value - min) / (max - min)) * 270 - 135)
  }, [value, min, max, rotation])

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startY = e.clientY
      const startVal = value

      const move = (ev: MouseEvent) => {
        const delta = (startY - ev.clientY) / 150
        let newVal = startVal + delta * (max - min)
        newVal = Math.min(max, Math.max(min, Math.round(newVal / step) * step))
        onChange(parseFloat(newVal.toFixed(3)))
      }

      const stop = () => {
        window.removeEventListener("mousemove", move)
        window.removeEventListener("mouseup", stop)
      }

      window.addEventListener("mousemove", move)
      window.addEventListener("mouseup", stop)
    },
    [value, min, max, step, onChange]
  )

  const glow = useTransform(rotation, (r) => {
    const intensity = 4 + Math.abs(r) / 30
    return `0 0 ${intensity}px rgba(90,180,255,0.6)`
  })

  return (
    <div className="flex flex-col items-center text-center select-none">
      <motion.div
        onMouseDown={handleDrag}
        style={{ rotate: rotation, width: size, height: size }}
        className="relative rounded-full border border-neutral-500
        bg-[radial-gradient(ellipse_at_center,_#cfcfcf_0%,_#7d7d7d_60%,_#4a4a4a_100%)]
        shadow-[inset_0_2px_6px_rgba(255,255,255,0.5),inset_0_-3px_8px_rgba(0,0,0,0.3)]
        cursor-grab active:cursor-grabbing"
      >
        {/* indicator notch */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[3px] h-[20%]
          rounded-full bg-gradient-to-b from-gray-800 to-black" />

        {/* glass highlight */}
        <div className="absolute inset-0 rounded-full
          bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_60%)]
          pointer-events-none" />

        {/* ambient glow */}
        <motion.div className="absolute inset-0 rounded-full" style={{ boxShadow: glow }} />
      </motion.div>

      <label className="mt-2 text-xs font-medium text-neutral-300">{label}</label>
      <motion.span className="text-[11px] text-blue-400 font-mono">{display}</motion.span>
    </div>
  )
}
