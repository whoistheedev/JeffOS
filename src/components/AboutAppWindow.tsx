// src/components/AboutAppWindow.tsx
import { Rnd } from "react-rnd"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "../store"
import { AppIconRenderer } from "./AppIconRenderer"
import type { AppId } from "../store/apps"

type Props = { id: string }

export default function AboutAppWindow({ id }: Props) {
  const closeWindow = useStore((s) => s.closeWindow)
  const win = useStore((s) => s.windows[id])
  const desktopIcons = useStore((s) => s.desktopIcons)

  if (!win) return null

  // Props passed when opening window
  const { appKey, title, description, version } = (win.props ?? {}) as {
    appKey?: AppId
    title?: string
    description?: string
    version?: string
  }

  // Find the matching desktop icon
  const icon = appKey
    ? desktopIcons.find((i) => i.id === appKey)
    : undefined

  return (
    <AnimatePresence>
      {/* Dim background overlay */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40"
        style={{ zIndex: 9998 }}
      />

      {/* Centered about window */}
      <motion.div
        key={id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.25 }}
        className="fixed"
        style={{
          zIndex: 9999,
          left: Math.floor((window.innerWidth - 320) / 2),
          top: Math.floor((window.innerHeight - 240) / 2),
        }}
      >
        <Rnd
          size={{ width: 320, height: 240 }}
          position={{ x: 0, y: 0 }}
          enableResizing={false}
          disableDragging
          className="rounded-lg shadow-2xl overflow-hidden bg-gradient-to-b from-[#f3f3f3] to-[#c9c9c9] border border-gray-500"
        >
          {/* Titlebar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-[#eaeaea] to-[#bcbcbc] border-b border-gray-500">
            <button
              aria-label="Close"
              className="w-3.5 h-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
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
              About {title}
            </div>
            <div className="w-6" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="h-[calc(100%-32px)] flex flex-col items-center justify-center text-center px-4 py-4">
            {icon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="w-12 h-12 mb-3 flex items-center justify-center"
              >
                <AppIconRenderer icon={icon} size="desktop" />
              </motion.div>
            )}
            <h2 className="text-base font-semibold text-gray-900">
              {title ?? "Unknown App"}
            </h2>
            <p className="text-xs text-gray-700 mb-1">
              Version {version ?? "1.0.0"}
            </p>
            <p className="text-xs text-gray-600 leading-snug max-w-[260px]">
              {description ?? `${title ?? "This app"} is part of Jeff OS X.`}
            </p>
          </div>
        </Rnd>
      </motion.div>
    </AnimatePresence>
  )
}
