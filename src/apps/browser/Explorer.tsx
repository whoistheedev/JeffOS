import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, RotateCw, X } from "lucide-react"
import { brushedMetalBar, tigerFont } from "../../lib/aquaSkin"

type Tab = {
  title: string
  url: string
  favicon?: string
  history: string[]
  index: number
}

type TopSite = { name: string; url: string; image: string }

const whitelist: Record<string, string> = {
  GitHub: "https://github.com/whoistheedev",
  LinkedIn: "https://www.linkedin.com/in/jeffrey-james-idodo-4402b6390",
  X: "https://x.com/whoistheedev",
}

const HOME_URL = "iweb://topsites"

/** Thumbnail derived from the domain's favicon — no broken remote placeholders. */
const siteImage = (url: string) => {
  try {
    const host = new URL(url, window.location.origin).hostname || "file"
    return `https://www.google.com/s2/favicons?sz=128&domain=${host}`
  } catch {
    return "/icons/explorer.png"
  }
}

const TOP_SITES: TopSite[] = [
  {
    name: "GitHub",
    url: "https://github.com/whoistheedev",
    image: siteImage("https://github.com/whoistheedev"),
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/jeffrey-james-idodo-4402b6390",
    image: siteImage("https://www.linkedin.com"),
  },
  {
    name: "X",
    url: "https://x.com/whoistheedev",
    image: siteImage("https://x.com"),
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

  const canBack = current.index > 0
  const canForward = current.index < current.history.length - 1

  function goBack() {
    if (!canBack) return
    setTabs((p) =>
      p.map((t, i) => {
        if (i !== active) return t
        const idx = t.index - 1
        setAddr(t.history[idx])
        return { ...t, index: idx, url: t.history[idx] }
      })
    )
    setLoading(true)
  }
  function goForward() {
    if (!canForward) return
    setTabs((p) =>
      p.map((t, i) => {
        if (i !== active) return t
        const idx = t.index + 1
        setAddr(t.history[idx])
        return { ...t, index: idx, url: t.history[idx] }
      })
    )
    setLoading(true)
  }
  function reload() {
    if (loading) {
      setLoading(false) // acts as Stop while loading
      return
    }
    if (current.url.startsWith("iweb://")) return
    if (iframeRef.current) {
      setLoading(true)
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src
    }
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

      {/* Toolbar — Tiger Safari brushed metal: graphite Back/Forward + Reload,
          then the recessed Aqua address lozenge (favicon + blue progress fill). */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-[#8d8d8d]"
        style={{ ...brushedMetalBar, fontFamily: tigerFont }}
      >
        {/* Joined Back/Forward graphite capsule */}
        <div
          className="flex overflow-hidden rounded-full"
          style={{ border: "1px solid #8e98a4", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)" }}
        >
          <NavButton aria="Back" disabled={!canBack} onClick={goBack}>
            <ChevronLeft size={15} />
          </NavButton>
          <div style={{ width: 1, background: "#8e98a4" }} />
          <NavButton aria="Forward" disabled={!canForward} onClick={goForward}>
            <ChevronRight size={15} />
          </NavButton>
        </div>

        {/* Address lozenge — recessed Aqua well with favicon + blue progress fill */}
        <div
          className="relative flex-1 flex items-center h-[24px] rounded-full overflow-hidden"
          style={{
            background: "#fff",
            border: "1px solid #9aa3ad",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.22)",
          }}
        >
          {/* Tiger blue progress fill behind the text */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 pointer-events-none"
            style={{ background: "rgba(120,175,255,0.45)", transformOrigin: "0% 50%" }}
            initial={{ width: "0%" }}
            animate={{ width: loading ? ["0%", "65%", "92%"] : "0%", opacity: loading ? 1 : 0 }}
            transition={{ duration: loading ? 1.6 : 0.3, ease: "easeOut" }}
          />
          <img src={faviconFor(current.url)} className="relative z-10 ml-2 w-3.5 h-3.5" alt="" />
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate(addr)}
            className="relative z-10 flex-1 bg-transparent text-[12px] px-2 h-full outline-none text-[#222]"
            aria-label="Address"
            spellCheck={false}
          />
          <button
            onClick={reload}
            aria-label={loading ? "Stop" : "Reload"}
            className="relative z-10 mr-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[#666] hover:text-black hover:bg-black/[0.06]"
          >
            {loading ? <X size={13} /> : <RotateCw size={12} />}
          </button>
        </div>
      </div>

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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-[640px] px-4"
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
                      className="relative w-full max-w-[192px] mx-auto aspect-[3/2] bg-white rounded-lg overflow-hidden shadow-lg border border-[#aaa] cursor-pointer origin-center"
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

/* ---------- Graphite Aqua toolbar button (Tiger Safari) ---------- */
function NavButton({
  children,
  onClick,
  disabled,
  aria,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  aria: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className="flex h-[24px] w-9 items-center justify-center text-[#3a4655] disabled:opacity-35"
      style={{
        background: "linear-gradient(180deg,#ffffff 0%,#e3e8ee 48%,#cdd5de 52%,#dde3ea 100%)",
      }}
    >
      {children}
    </button>
  )
}
