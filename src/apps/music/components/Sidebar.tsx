import React, { useState } from "react"
import { motion } from "framer-motion"
import { Music, Film, Mic2, Tv, Clock, Star, Heart } from "lucide-react"

const sections = [
  {
    title: "Library",
    items: [
      { name: "Music", icon: <Music size={12} strokeWidth={2} /> },
      { name: "Movies", icon: <Film size={12} strokeWidth={2} /> },
      { name: "Podcasts", icon: <Mic2 size={12} strokeWidth={2} /> },
      { name: "TV Shows", icon: <Tv size={12} strokeWidth={2} /> },
    ],
  },
  {
    title: "Playlists",
    items: [
      { name: "Recently Added", icon: <Clock size={12} strokeWidth={2} /> },
      { name: "Top 25", icon: <Star size={12} strokeWidth={2} /> },
      { name: "Favorites", icon: <Heart size={12} strokeWidth={2} /> },
    ],
  },
]

export function Sidebar() {
  const [active, setActive] = useState("Music")

  return (
    <div
      className="
        w-[190px] flex flex-col overflow-y-auto
        text-[12px] font-[Lucida_Grande,system-ui,sans-serif]
        select-none relative
        bg-[linear-gradient(180deg,#c7c7c7_0%,#a9a9a9_100%)]
        dark:bg-[linear-gradient(180deg,#1f1f1f_0%,#121212_100%)]
        border-r border-[#8d8d8d]/60
        [box-shadow:inset_-1px_0_0_rgba(255,255,255,0.4)]
      "
    >
      {sections.map((sec, si) => (
        <div key={sec.title} className="pb-2">
          {/* Section title */}
          <div
            className="
              px-3 pt-3 pb-1
              text-[10.5px] uppercase font-semibold tracking-wide
              text-[#555] dark:text-[#aaa]
            "
          >
            {sec.title}
          </div>

          {/* Items */}
          {sec.items.map(({ name, icon }) => {
            const isActive = active === name
            return (
              <motion.div
                key={name}
                onClick={() => setActive(name)}
                whileTap={{ scale: 0.97 }}
                className={`
                  flex items-center gap-2 px-3 py-[5px] cursor-default
                  transition-all duration-100 rounded-[3px]
                  ${
                    isActive
                      ? "text-white bg-[linear-gradient(180deg,#4fa3ff_0%,#1c6fff_100%)] shadow-[inset_0_1px_rgba(255,255,255,0.5),inset_0_-1px_rgba(0,0,0,0.25)]"
                      : "text-[#1a1a1a] hover:text-white hover:bg-[linear-gradient(180deg,#5cb4ff_0%,#1a79ff_100%)] hover:shadow-[0_0_4px_rgba(80,160,255,0.6)]"
                  }
                `}
              >
                <div
                  className={`transition-colors ${
                    isActive ? "text-white" : "text-[#444] dark:text-neutral-400"
                  }`}
                >
                  {icon}
                </div>
                <span className="truncate">{name}</span>
              </motion.div>
            )
          })}

          {/* Divider */}
          {si < sections.length - 1 && (
            <div className="h-[1px] mx-2 mt-2 mb-1 bg-gradient-to-b from-white to-[#8d8d8d]" />
          )}
        </div>
      ))}

      {/* Glass highlight overlay */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.2)_0%,transparent_40%,transparent_100%)]
          dark:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05)_0%,transparent_60%)]
        "
      />
    </div>
  )
}
