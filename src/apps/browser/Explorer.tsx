import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

type Tab = {
  title: string
  url: string
  favicon?: string
  history: string[]
  index: number
}

type TopSite = { name: string; url: string; image: string }

const whitelist: Record<string, string> = {
  Portfolio: "https://yourdomain.com",
  GitHub: "https://github.com/yourhandle",
  LinkedIn: "https://linkedin.com/in/yourhandle",
  Resume: "/resume.pdf",
}

const HOME_URL = "iweb://topsites"

const TOP_SITES: TopSite[] = [
  {
    name: "Portfolio",
    url: "https://yourdomain.com",
    image:
      "https://YOUR_SUPABASE_URL/storage/v1/object/public/siteshots/portfolio.png",
  },
  {
    name: "GitHub",
    url: "https://github.com/yourhandle",
    image:
      "https://YOUR_SUPABASE_URL/storage/v1/object/public/siteshots/github.png",
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/yourhandle",
    image:
      "https://YOUR_SUPABASE_URL/storage/v1/object/public/siteshots/linkedin.png",
  },
  {
    name: "Resume",
    url: "/resume.pdf",
    image:
      "https://YOUR_SUPABASE_URL/storage/v1/object/public/siteshots/resume.png",
  },
]

export default function Browser() {
  const [tabs, setTabs] = useState<Tab[]>([
    { title: "Top Sites", url: HOME_URL, history: [HOME_URL], index: 0 },
  ])
  const [active, setActive] = useState(0)
  const [addr, setAddr] = useState(HOME_URL)
  const [loading, setLoading] = useState(false)
  const [zooming, setZooming] = useState<TopSite | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const current = tabs[active]

  /** --- helpers --- **/
  function faviconFor(url: string) {
    try {
      const d = new URL(url).hostname
      return `https://www.google.com/s2/favicons?sz=32&domain=${d}`
    } catch {
      return "🌐"
    }
  }

  function navigate(url: string) {
    if (url.startsWith("iweb://")) {
      setTabs((p) =>
        p.map((t, i) => (i === active ? { ...t, url, title: "Top Sites" } : t))
      )
      setAddr(url)
      return
    }
    setTabs((p) =>
      p.map((t, i) =>
        i === active
          ? {
              ...t,
              url,
              history:
                t.index < t.history.length - 1
                  ? [...t.history.slice(0, t.index + 1), url]
                  : [...t.history, url],
              index: t.index + 1,
            }
          : t
      )
    )
    setAddr(url)
    setLoading(true)
  }

  function newTab() {
    setTabs((p) => [
      ...p,
      { title: "New Tab", url: HOME_URL, history: [HOME_URL], index: 0 },
    ])
    setActive(tabs.length)
    setAddr(HOME_URL)
  }
  function closeTab(i: number) {
    if (tabs.length === 1) return
    const n = tabs.filter((_, j) => j !== i)
    setTabs(n)
    setActive(Math.max(0, i - 1))
  }

  useEffect(() => {
    const ifr = iframeRef.current
    if (!ifr) return
    const onLoad = () => setLoading(false)
    ifr.addEventListener("load", onLoad)
    return () => ifr.removeEventListener("load", onLoad)
  }, [active])

  /** --- UI --- **/
  return (
    <div className="flex flex-col h-full text-sm font-[system-ui] bg-[linear-gradient(180deg,#e2e2e2_0%,#c8c8c8_100%)] border border-[#a7a7a7]">
      {/* Tabs */}
      <div className="flex items-end bg-[linear-gradient(180deg,#f1f1f1_0%,#c0c0c0_100%)] border-b border-[#9b9b9b] overflow-x-auto">
        {tabs.map((t, i) => (
          <motion.div
            key={i}
            onClick={() => {
              setActive(i)
              setAddr(t.url)
            }}
            className={`flex items-center gap-1 px-3 py-1 mx-[1px] rounded-t-md cursor-default border border-b-0 ${
              i === active
                ? "bg-[linear-gradient(180deg,#fff_0%,#dadada_100%)] shadow-inner"
                : "bg-[linear-gradient(180deg,#d8d8d8_0%,#bcbcbc_100%)] hover:bg-[#e2e2e2]"
            }`}
          >
            <img src={faviconFor(t.url)} className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{t.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(i)
                }}
                className="ml-1 text-xs opacity-50 hover:opacity-100"
              >
                ×
              </button>
            )}
          </motion.div>
        ))}
        <button
          onClick={newTab}
          className="ml-2 px-3 pb-1 text-lg text-[#555] hover:text-black"
        >
          ＋
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#999] bg-[linear-gradient(180deg,#f7f7f7_0%,#dadada_100%)]">
        <Input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigate(addr)}
          className="flex-1 bg-white border border-[#999] rounded-md text-xs px-2 h-6 focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Loading bar */}
      <motion.div
        className="h-[2px] bg-[#0b84ff]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: loading ? [0, 0.6, 1] : 0 }}
        transition={{ duration: loading ? 1.5 : 0.4, ease: "easeInOut" }}
        style={{ transformOrigin: "0% 50%" }}
      />

      {/* Content */}
      <div className="flex-1 bg-[#eaeaea] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {current.url === HOME_URL ? (
            <motion.div
              key="wall"
              className="absolute inset-0 flex flex-col items-center justify-start pt-10 overflow-auto"
              style={{ perspective: "1200px" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-lg font-semibold text-[#333] mb-6">
                Top Sites
              </h1>
              <div
                className="grid grid-cols-3 gap-8"
                style={{ transform: "rotateX(6deg)" }}
              >
                {TOP_SITES.map((site, idx) => {
                  const tilt = (idx % 3) - 1 // -1,0,1
                  return (
                    <motion.div
                      key={site.name}
                      whileHover={{
                        scale: 1.05,
                        rotateY: tilt * 8,
                        z: 20,
                      }}
                      onClick={() => {
                        setZooming(site)
                        setTimeout(() => {
                          navigate(site.url)
                          setZooming(null)
                        }, 400)
                      }}
                      className="relative w-48 h-32 bg-white rounded-lg overflow-hidden shadow-lg border border-[#aaa] cursor-pointer origin-center"
                      style={{
                        transform: `rotateY(${tilt * 10}deg)`,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <img
                        src={site.image}
                        alt={site.name}
                        className="absolute inset-0 object-cover w-full h-full"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs text-center py-1">
                        {site.name}
                      </div>
                      <div className="absolute bottom-[-20%] left-0 right-0 opacity-25 blur-sm">
                        <img
                          src={site.image}
                          className="w-full h-8 object-cover rotate-180 scale-y-[-1]"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                    </motion.div>
                  )
                })}
              </div>

              {/* glossy floor reflection */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0002] to-transparent" />
            </motion.div>
          ) : (
            <motion.iframe
              key={current.url}
              ref={iframeRef}
              src={current.url}
              title={current.title}
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </AnimatePresence>

        {/* zoom animation */}
        <AnimatePresence>
          {zooming && (
            <motion.div
              key="zoom"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${zooming.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
