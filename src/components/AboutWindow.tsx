import { Rnd } from "react-rnd"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "../store"
import AboutThisMac from "../apps/system/AboutThisMac"

type Props = { id: string }

export default function AboutWindow({ id }: Props) {
  const closeWindow = useStore((s) => s.closeWindow)
  const win = useStore((s) => s.windows[id])

  if (!win) return null

  return (
    <AnimatePresence>
      {/* Overlay that blocks background */}
      <div
        className="fixed inset-0 bg-black/40"
        style={{ zIndex: 9998 }} // always above other windows
      />

     <motion.div
  key={id}
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.2 }}
  className="fixed"
  style={{
    zIndex: 9999, // always on top
    left: Math.floor((window.innerWidth - 420) / 2),
    top: Math.floor((window.innerHeight - 360) / 2), // ⬅️ match new height
  }}
>
  <Rnd
    size={{ width: 420, height: 360 }}   // ⬅️ authentic size
    position={{ x: 0, y: 0 }}
    enableResizing={false}
    disableDragging
    className="rounded-md shadow-xl overflow-hidden bg-[#dcdcdc] border border-gray-600"
  >

          {/* Titlebar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-[#dcdcdc] to-[#b8b8b8] border-b border-gray-500">
            {/* Only Close button */}
            <button
              aria-label="Close"
              className="w-3.5 h-3.5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #ffb3ad, #e53935 70%)",
                boxShadow: `
                  inset 0 1px rgba(255,255,255,0.8),
                  inset 0 -1px rgba(0,0,0,0.6),
                  0 1px 2px rgba(0,0,0,0.6)
                `,
                border: "1px solid rgba(0,0,0,0.4)",
              }}
              onClick={() => closeWindow(id)}
            />
            <div className="flex-1 text-center text-sm font-medium text-gray-800">
              About This Mac
            </div>
            <div className="w-6" />
          </div>

          {/* Content */}
          <div className="h-[calc(100%-32px)] overflow-hidden">
            <AboutThisMac />
          </div>
        </Rnd>
      </motion.div>
    </AnimatePresence>
  )
}
