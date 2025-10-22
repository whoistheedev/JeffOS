// src/apps/terminal/Terminal.tsx
import React, { useState, useRef, useEffect } from "react"
import { commandBus } from "../../lib/commandBus"

type Line = { text: string; className?: string }
type FSNode = { type: "dir" | "file"; name: string; target?: string }

const FS: Record<string, FSNode[]> = {
  "/": [
    { type: "dir", name: "Projects" },
    { type: "file", name: "Resume.pdf", target: "resume.open" },
    { type: "dir", name: "Guestbook" },
  ],
  "/Projects": [
    { type: "file", name: "MacPortfolio", target: "finder.open" },
  ],
}

const COMMANDS = [
  "help",
  "about",
  "projects",
  "resume",
  "socials",
  "clear",
  "ls",
  "cd",
  "cat",
  "open",
  "man",
  "sudo",
]

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { text: "Welcome to Portfolio Terminal. Type 'help' for commands." },
  ])
  const [input, setInput] = useState("")
  const [cwd, setCwd] = useState("/")
  const [history, setHistory] = useState<string[]>([])
  const [histIndex, setHistIndex] = useState(-1)
  const [awaitingPassword, setAwaitingPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [lines])

  const append = (text: string, className?: string) =>
    setLines((prev) => [...prev, { text, className }])

  const runCommand = (cmdRaw: string) => {
    const cmd = cmdRaw.trim()
    if (!cmd) return

    append(`visitor@portfolio-os ${cwd} % ${cmd}`, "prompt")
    setHistory((h) => [...h, cmd])
    setHistIndex(-1)
    setInput("")

    if (awaitingPassword) {
      append("Sorry, try again.", "error")
      setAwaitingPassword(false)
      return
    }

    const [base, ...args] = cmd.split(" ")

    switch (base) {
      case "help":
        append("Available commands:")
        append(COMMANDS.join(", "))
        break

      case "about":
        append("👋 Hello! I'm Jeffrey — a creative full-stack developer passionate about design and user experience.")
        append("Explore my projects or open Resume.pdf for more info.")
        break

      case "projects":
      case "ls": {
        const dir = FS[cwd]
        if (!dir) append("Directory not found.", "error")
        else append(dir.map((f) => (f.type === "dir" ? `📁 ${f.name}/` : `📄 ${f.name}`)).join("  "))
        break
      }

      case "cd": {
        const target = args[0]
        if (!target) return
        if (target === "..") {
          if (cwd !== "/") setCwd("/")
        } else {
          const path = cwd === "/" ? `/${target}` : `${cwd}/${target}`
          if (FS[path]) setCwd(path)
          else append(`cd: no such file or directory: ${target}`, "error")
        }
        break
      }

      case "cat":
        append("Use 'open' to view files graphically.")
        break

      case "open": {
        const target = args[0]
        const dir = FS[cwd]
        const node = dir?.find((f) => f.name === target)
        if (node?.target) {
          commandBus.dispatch(node.target)
          append(`Opening ${target}…`)
        } else {
          append(`open: no such file or app: ${target}`, "error")
        }
        break
      }

      case "resume":
        commandBus.dispatch("resume.open")
        append("Opening Resume.pdf…")
        break

      case "socials":
        append("🌐 LinkedIn: linkedin.com/in/jeffrey")
        append("💻 GitHub: github.com/whoistheedev")
        append("🐦 Twitter: x.com/whoistheedev")
        break

      case "sudo":
        append("Password:", "prompt")
        setAwaitingPassword(true)
        break

      case "clear":
        setLines([])
        break

      case "man":
        append("This isn’t UNIX, but close enough 😄 Try 'help'.")
        break

      default:
        append(`zsh: command not found: ${base}`, "error")
        break
    }
  }

  /* 🔁 History navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") runCommand(input)
    else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (history.length === 0) return
      const newIndex = histIndex === -1 ? history.length - 1 : Math.max(histIndex - 1, 0)
      setHistIndex(newIndex)
      setInput(history[newIndex])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (histIndex === -1) return
      const newIndex = histIndex + 1
      if (newIndex >= history.length) {
        setHistIndex(-1)
        setInput("")
      } else {
        setHistIndex(newIndex)
        setInput(history[newIndex])
      }
    }
  }

  return (
    <div className="w-full h-full bg-[#2c2c2c] text-[#e6e6e6] font-[Menlo,Monaco,monospace] text-sm p-3 rounded-b-xl overflow-hidden">
      <div className="mb-1 text-xs text-gray-400 font-semibold select-none">Portfolio Terminal</div>
      <div className="space-y-1 overflow-y-auto h-[calc(100%-2rem)] scrollbar-hide">
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.className === "prompt"
                ? "text-[#d6d6d6]"
                : line.className === "error"
                ? "text-red-400"
                : "text-gray-200"
            }
          >
            {line.text}
          </div>
        ))}
        <div className="flex items-center">
          <span className="text-[#00ff7f]">visitor@portfolio-os</span>
          <span className="text-gray-500 ml-1">{cwd}</span>
          <span className="text-white ml-1">%</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-white ml-2 flex-1"
            autoFocus
          />
          <span className="animate-pulse text-gray-400">▋</span>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
