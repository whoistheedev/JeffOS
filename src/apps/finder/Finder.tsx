import React, { useEffect, useMemo, useState } from "react"
import { useStore } from "../../store"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent } from "../../components/ui/dialog"
import * as ContextMenu from "@radix-ui/react-context-menu"
import { LayoutGrid, List, Columns, ChevronLeft, ChevronRight } from "lucide-react"
import type { AppIcon } from "../../store/apps"
import { AppIconRenderer } from "../../components/AppIconRenderer" // ✅ shared renderer

type ViewMode = "icon" | "list" | "column"
type FinderItemType = "app" | "folder"

interface FinderEntry {
  id: string
  title: string
  type: FinderItemType
  iconUrl: string
  children?: FinderEntry[]
  appRef?: AppIcon
}

export default function Finder() {
  const apps = useStore((s) => s.desktopIcons)

  // 🔗 Global trash state
  const trash = useStore((s) => s.trash)
  const moveToTrashGlobal = useStore((s) => s.moveToTrash)
  const restoreFromTrash = useStore((s) => s.restoreFromTrash)
  const emptyTrash = useStore((s) => s.emptyTrash)

  // Read Finder launch props from window store
  const windows = useStore((s) => s.windows)
  const win = Object.values(windows).find((w) => w.appKey === "finder")
  const launchProps = (win?.props as { path?: string[] }) || {}

  // Wrap apps as Finder entries
  const appEntries: FinderEntry[] = apps.map((a) => ({
    id: a.id,
    title: a.title,
    type: "app",
    iconUrl: a.iconUrl ?? "",
    appRef: a as AppIcon,
  }))

  // Default folders
  const rootEntries: FinderEntry[] = [
    {
      id: "applications",
      title: "Applications",
      type: "folder",
      iconUrl: "/icons/folder-applications.png",
      children: appEntries,
    },
    {
      id: "desktop",
      title: "Desktop",
      type: "folder",
      iconUrl: "/icons/folder-desktop.png",
      children: [],
    },
    {
      id: "documents",
      title: "Documents",
      type: "folder",
      iconUrl: "/icons/folder-documents.png",
      children: [],
    },
    {
      id: "trash",
      title: "Trash",
      type: "folder",
      // ✅ sync icon with Dock (empty/full)
      iconUrl: trash.length === 0 ? "/icons/trash.png" : "/icons/trash-full.png",
      children: trash.map((t) => ({
        id: t.id,
        title: t.title,
        type: "app",
        iconUrl: t.iconUrl ?? "",
        appRef: t as AppIcon,
      })),
    },
  ]

  const [view, setView] = useState<ViewMode>("icon")
  const [search, setSearch] = useState("")
  const [cwd, setCwd] = useState<FinderEntry[]>(rootEntries)
  const [path, setPath] = useState<string[]>(["Macintosh HD"])

  // History stack
  const [history, setHistory] = useState<FinderEntry[][]>([rootEntries])
  const [historyIndex, setHistoryIndex] = useState(0)

  // 🆕 Open Trash directly if Finder was launched with props
  useEffect(() => {
    if (launchProps.path && launchProps.path.includes("Trash")) {
      const trashFolder = rootEntries.find((e) => e.id === "trash")
      if (trashFolder) {
        setCwd(trashFolder.children ?? [])
        setPath(["Macintosh HD", "Trash"])
        setHistory([rootEntries, trashFolder.children ?? []])
        setHistoryIndex(1)
        return
      }
    }
    // default: root
    setCwd(rootEntries)
    setHistory([rootEntries])
    setHistoryIndex(0)
  }, [launchProps.path, trash])

  // Column view state
  const [columnSelection, setColumnSelection] = useState<
    { [level: number]: FinderEntry | null }
  >({})

  const [quickLook, setQuickLook] = useState<FinderEntry | null>(null)
  const [getInfo, setGetInfo] = useState<FinderEntry | null>(null)

  // Spotlight filter
  const filtered = useMemo(() => {
    if (!search.trim()) return cwd
    const q = search.toLowerCase()
    return cwd.filter((e) => e.title.toLowerCase().includes(q))
  }, [cwd, search])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "1") setView("icon")
      if (e.metaKey && e.key === "2") setView("list")
      if (e.metaKey && e.key === "3") setView("column")
      if (e.code === "Space") {
        e.preventDefault()
        if (filtered.length) setQuickLook(filtered[0])
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [filtered])

  function handleOpen(entry: FinderEntry) {
    if (entry.type === "folder") {
      setCwd(entry.children ?? [])
      setPath((p) => [...p, entry.title])
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(entry.children ?? [])
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    } else if (entry.type === "app" && entry.appRef) {
      entry.appRef.launch()
    }
  }

  function handleBack() {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setCwd(history[newIndex])
      setPath((p) => p.slice(0, -1))
    }
  }

  function handleForward() {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setCwd(history[newIndex])
      setPath((p) => [...p, "…"])
    }
  }

  function moveToTrash(entry: FinderEntry) {
    if (entry.appRef) {
      moveToTrashGlobal(entry.appRef)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 
                      bg-gradient-to-b from-gray-200 to-gray-300 
                      border-b border-gray-400 shadow-inner">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="rounded-md border border-gray-400 bg-white/90 shadow-sm 
                       hover:bg-gray-50 data-[disabled]:opacity-40"
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleForward}
            disabled={historyIndex === history.length - 1}
            className="rounded-md border border-gray-400 bg-white/90 shadow-sm 
                       hover:bg-gray-50 data-[disabled]:opacity-40"
          >
            <ChevronRight size={14} />
          </Button>
          <div className="flex gap-1 ml-2 bg-white rounded-md border border-gray-400 shadow-inner">
            <Button
              size="sm"
              variant={view === "icon" ? "default" : "ghost"}
              className="rounded-none px-2 py-1"
              onClick={() => setView("icon")}
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              size="sm"
              variant={view === "list" ? "default" : "ghost"}
              className="rounded-none px-2 py-1"
              onClick={() => setView("list")}
            >
              <List size={14} />
            </Button>
            <Button
              size="sm"
              variant={view === "column" ? "default" : "ghost"}
              className="rounded-none px-2 py-1"
              onClick={() => setView("column")}
            >
              <Columns size={14} />
            </Button>
          </div>
        </div>
        <input
          aria-label="Spotlight Search"
          type="search"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-400 rounded-md 
                     bg-white/95 shadow-inner outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Path bar */}
      <div className="px-3 py-1 border-b text-xs text-gray-600 bg-gray-50">
        {path.join(" / ")}
      </div>

      {/* Main body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 border-r bg-gradient-to-b from-gray-100 to-gray-200 
                        text-sm flex-shrink-0 overflow-y-auto">
          {/* Devices */}
          <div className="px-2 py-1 text-[11px] font-semibold text-gray-500">DEVICES</div>
          <div className="py-1">
            {[
              { id: "network", title: "Network", iconUrl: "/icons/network.png" },
              { id: "untitled", title: "Untitled", iconUrl: "/icons/drive.png" },
              { id: "dvd", title: "DVD", iconUrl: "/icons/dvd.png" },
            ].map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-r-sm
                  ${path.includes(entry.title) ? "bg-blue-500 text-white" : "hover:bg-gray-300"}`}
                onClick={() => {
                  setCwd([])
                  setPath(["Macintosh HD", entry.title])
                  setHistory([rootEntries])
                  setHistoryIndex(0)
                }}
              >
                <img src={entry.iconUrl} alt={entry.title} className="w-4 h-4" />
                <span className="truncate">{entry.title}</span>
              </div>
            ))}
          </div>

          {/* Places */}
          <div className="px-2 py-1 text-[11px] font-semibold text-gray-500">PLACES</div>
          <div className="py-1">
            {rootEntries
              .filter((f) =>
                ["desktop", "applications", "documents"].includes(f.id) ||
                ["movies", "music", "pictures"].includes(f.id)
              )
              .map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-r-sm
                    ${path.includes(entry.title) ? "bg-blue-500 text-white" : "hover:bg-gray-300"}`}
                  onClick={() => {
                    setCwd(entry.children ?? [])
                    setPath(["Macintosh HD", entry.title])
                    setHistory([rootEntries, entry.children ?? []])
                    setHistoryIndex(1)
                  }}
                >
                  <img src={entry.iconUrl} alt={entry.title} className="w-4 h-4" />
                  <span className="truncate">{entry.title}</span>
                </div>
              ))}
          </div>

          {/* Trash */}
          <div className="px-2 py-1 text-[11px] font-semibold text-gray-500">TRASH</div>
          <div className="py-1">
            <div
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-r-sm
                ${path.includes("Trash") ? "bg-blue-500 text-white" : "hover:bg-gray-300"}`}
              onClick={() => {
                const trashFolder = rootEntries.find((e) => e.id === "trash")
                setCwd(trashFolder?.children ?? [])
                setPath(["Macintosh HD", "Trash"])
                setHistory([rootEntries, trashFolder?.children ?? []])
                setHistoryIndex(1)
              }}
            >
              <img
                src={trash.length === 0 ? "/icons/trash.png" : "/icons/trash-full.png"}
                alt="Trash"
                className="w-4 h-4"
              />
              <span className="truncate">Trash</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 bg-white">
          {view === "icon" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="list">
              {filtered.map((entry) => (
                <FinderEntryItem
                  key={entry.id}
                  entry={entry}
                  onOpen={() => handleOpen(entry)}
                  onQuickLook={() => setQuickLook(entry)}
                  onGetInfo={() => setGetInfo(entry)}
                  onMoveToTrash={() => moveToTrash(entry)}
                  onEmptyTrash={emptyTrash}
                  restoreFromTrash={restoreFromTrash}
                  path={path}
                />
              ))}
            </div>
          )}

          {view === "list" && (
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1 pr-3">Name</th>
                  <th className="py-1 pr-3">Kind</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <ContextMenu.Root key={entry.id}>
                    <ContextMenu.Trigger asChild>
                      <tr
                        className="hover:bg-gray-100 cursor-pointer"
                        onDoubleClick={() => handleOpen(entry)}
                      >
                        <td className="py-1 pr-3 flex items-center gap-2">
                          {entry.appRef ? (
                            <AppIconRenderer icon={entry.appRef} size="list" />
                          ) : (
                            <img
                              src={entry.iconUrl}
                              alt={entry.title}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          {entry.title}
                        </td>
                        <td className="py-1 pr-3">
                          {entry.type === "folder" ? "Folder" : "Application"}
                        </td>
                      </tr>
                    </ContextMenu.Trigger>
                    <FinderContextMenu
                      entry={entry}
                      onOpen={() => handleOpen(entry)}
                      onQuickLook={() => setQuickLook(entry)}
                      onGetInfo={() => setGetInfo(entry)}
                      onMoveToTrash={() => moveToTrash(entry)}
                      onEmptyTrash={emptyTrash}
                      restoreFromTrash={restoreFromTrash}
                      path={path}
                    />
                  </ContextMenu.Root>
                ))}
              </tbody>
            </table>
          )}

          {view === "column" && (
            <div className="flex gap-4 overflow-x-auto" role="tree">
              {/* Column 1 */}
              <div className="flex-1 min-w-[200px] border-r pr-2">
                {rootEntries.map((entry) => (
                  <ContextMenu.Root key={entry.id}>
                    <ContextMenu.Trigger asChild>
                      <div
                        className="cursor-pointer hover:bg-gray-100 p-1 rounded flex items-center gap-2"
                        onClick={() => setColumnSelection({ 1: entry })}
                        onDoubleClick={() => handleOpen(entry)}
                      >
                        {entry.appRef ? (
                          <AppIconRenderer icon={entry.appRef} size="column" />
                        ) : (
                          <img src={entry.iconUrl} alt={entry.title} className="w-5 h-5 object-contain" />
                        )}
                        {entry.title}
                      </div>
                    </ContextMenu.Trigger>
                    <FinderContextMenu
                      entry={entry}
                      onOpen={() => handleOpen(entry)}
                      onQuickLook={() => setQuickLook(entry)}
                      onGetInfo={() => setGetInfo(entry)}
                      onMoveToTrash={() => moveToTrash(entry)}
                      onEmptyTrash={emptyTrash}
                      restoreFromTrash={restoreFromTrash}
                      path={path}
                    />
                  </ContextMenu.Root>
                ))}
              </div>

              {/* Column 2 */}
              {columnSelection[1]?.children && (
                <div className="flex-1 min-w-[200px] border-r pr-2">
                  {columnSelection[1].children!.map((entry) => (
                    <ContextMenu.Root key={entry.id}>
                      <ContextMenu.Trigger asChild>
                        <div
                          className="cursor-pointer hover:bg-gray-100 p-1 rounded flex items-center gap-2"
                          onClick={() => setColumnSelection({ 2: entry })}
                          onDoubleClick={() => handleOpen(entry)}
                        >
                          {entry.appRef ? (
                            <AppIconRenderer icon={entry.appRef} size="column" />
                          ) : (
                            <img src={entry.iconUrl} alt={entry.title} className="w-5 h-5 object-contain" />
                          )}
                          {entry.title}
                        </div>
                      </ContextMenu.Trigger>
                      <FinderContextMenu
                        entry={entry}
                        onOpen={() => handleOpen(entry)}
                        onQuickLook={() => setQuickLook(entry)}
                        onGetInfo={() => setGetInfo(entry)}
                        onMoveToTrash={() => moveToTrash(entry)}
                        onEmptyTrash={emptyTrash}
                        restoreFromTrash={restoreFromTrash}
                        path={path}
                      />
                    </ContextMenu.Root>
                  ))}
                </div>
              )}

              {/* Column 3 */}
              {columnSelection[2]?.children && (
                <div className="flex-1 min-w-[200px] pr-2">
                  {columnSelection[2].children!.map((entry) => (
                    <ContextMenu.Root key={entry.id}>
                      <ContextMenu.Trigger asChild>
                        <div
                          className="cursor-pointer hover:bg-gray-100 p-1 rounded flex items-center gap-2"
                          onClick={() => setColumnSelection({ 3: entry })}
                          onDoubleClick={() => handleOpen(entry)}
                        >
                          {entry.appRef ? (
                            <AppIconRenderer icon={entry.appRef} size="column" />
                          ) : (
                            <img src={entry.iconUrl} alt={entry.title} className="w-5 h-5 object-contain" />
                          )}
                          {entry.title}
                        </div>
                      </ContextMenu.Trigger>
                      <FinderContextMenu
                        entry={entry}
                        onOpen={() => handleOpen(entry)}
                        onQuickLook={() => setQuickLook(entry)}
                        onGetInfo={() => setGetInfo(entry)}
                        onMoveToTrash={() => moveToTrash(entry)}
                        onEmptyTrash={emptyTrash}
                        restoreFromTrash={restoreFromTrash}
                        path={path}
                      />
                    </ContextMenu.Root>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-2 py-1 border-t text-xs text-gray-600 bg-gray-100/60">
        {filtered.length} items, {Math.floor(Math.random() * 50) + 50} GB available
      </div>

      {/* Quick Look */}
      <Dialog open={!!quickLook} onOpenChange={(o) => !o && setQuickLook(null)}>
        <DialogContent className="max-w-sm">
          {quickLook && (
            <div className="text-center">
              {quickLook.appRef ? (
                <AppIconRenderer icon={quickLook.appRef} size="desktop" />
              ) : (
                <img src={quickLook.iconUrl} alt={quickLook.title} className="mx-auto w-20 h-20 object-contain" />
              )}
              <h2 className="font-semibold mt-2">{quickLook.title}</h2>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Get Info */}
      <Dialog open={!!getInfo} onOpenChange={(o) => !o && setGetInfo(null)}>
        <DialogContent className="max-w-sm space-y-2 text-sm">
          {getInfo && (
            <>
              <h2 className="font-bold text-lg">{getInfo.title}</h2>
              <div>
                <span className="text-gray-500">Kind:</span>{" "}
                {getInfo.type === "folder" ? "Folder" : "Application"}
              </div>
              <div>
                <span className="text-gray-500">Created:</span> Jan 1, 2025
              </div>
              <div>
                <span className="text-gray-500">Modified:</span> Today
              </div>
              <div>
                <span className="text-gray-500">Where:</span> {path.join("/")}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Shared Context Menu */
function FinderContextMenu({
  entry,
  onOpen,
  onQuickLook,
  onGetInfo,
  onMoveToTrash,
  onEmptyTrash,
  restoreFromTrash,
  path,
}: {
  entry: FinderEntry
  onOpen: () => void
  onQuickLook: () => void
  onGetInfo: () => void
  onMoveToTrash: () => void
  onEmptyTrash: () => void
  restoreFromTrash: (id: string) => void
  path: string[]
}) {
  const setTrash = useStore((s) => s.setTrash)
  const trash = useStore((s) => s.trash)

  return (
    <ContextMenu.Content
      alignOffset={4}
      className="z-50 min-w-[8rem] rounded-md border bg-white p-1 shadow-md"
    >
      <ContextMenu.Item
        onSelect={onOpen}
        className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-blue-500/10"
      >
        Open
      </ContextMenu.Item>
      <ContextMenu.Item
        onSelect={onQuickLook}
        className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-blue-500/10"
      >
        Quick Look
      </ContextMenu.Item>
      <ContextMenu.Item
        onSelect={onGetInfo}
        className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-blue-500/10"
      >
        Get Info
      </ContextMenu.Item>
      <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

      {entry.id === "trash" ? (
        <ContextMenu.Item
          onSelect={onEmptyTrash}
          className="cursor-pointer px-2 py-1.5 text-sm rounded text-red-600 hover:bg-red-500/10"
        >
          Empty Trash
        </ContextMenu.Item>
      ) : path.includes("Trash") ? (
        <>
          <ContextMenu.Item
            onSelect={() => restoreFromTrash(entry.id)}
            className="cursor-pointer px-2 py-1.5 text-sm rounded hover:bg-blue-500/10"
          >
            Put Back
          </ContextMenu.Item>
          <ContextMenu.Item
            onSelect={() => setTrash(trash.filter((t) => t.id !== entry.id))}
            className="cursor-pointer px-2 py-1.5 text-sm rounded text-red-600 hover:bg-red-500/10"
          >
            Delete Immediately
          </ContextMenu.Item>
        </>
      ) : (
        <ContextMenu.Item
          onSelect={onMoveToTrash}
          className="cursor-pointer px-2 py-1.5 text-sm rounded text-red-600 hover:bg-red-500/10"
        >
          Move to Trash
        </ContextMenu.Item>
      )}
    </ContextMenu.Content>
  )
}

/** Finder entry item (icon view) */
function FinderEntryItem({
  entry,
  onOpen,
  onQuickLook,
  onGetInfo,
  onMoveToTrash,
  onEmptyTrash,
  restoreFromTrash,
  path,
}: {
  entry: FinderEntry
  onOpen: () => void
  onQuickLook: () => void
  onGetInfo: () => void
  onMoveToTrash: () => void
  onEmptyTrash: () => void
  restoreFromTrash: (id: string) => void
  path: string[]
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          role="listitem"
          tabIndex={0}
          className="flex flex-col items-center cursor-default select-none 
                     outline-none focus:ring-2 focus:ring-blue-400 rounded p-1"
          onDoubleClick={onOpen}
        >
          <div className="relative w-20 h-20 flex items-center justify-center">
            {entry.appRef ? (
              <AppIconRenderer icon={entry.appRef} size="desktop" />
            ) : (
              <img src={entry.iconUrl} alt={entry.title} className="w-full h-full object-contain" />
            )}
          </div>
          <div className="mt-1 text-center text-xs max-w-[8rem] truncate">
            {entry.title}
          </div>
        </div>
      </ContextMenu.Trigger>
      <FinderContextMenu
        entry={entry}
        onOpen={onOpen}
        onQuickLook={onQuickLook}
        onGetInfo={onGetInfo}
        onMoveToTrash={onMoveToTrash}
        onEmptyTrash={onEmptyTrash}
        restoreFromTrash={restoreFromTrash}
        path={path}
      />
    </ContextMenu.Root>
  )
}
