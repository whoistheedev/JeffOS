import type { StateCreator } from "zustand"
import type { ComponentType } from "react"
import CalendarIcon from "../apps/calendar/CalendarIcon"

export type AppId =
  | "finder"
  | "guestbook"
  | "games"
  | "wallpapers"
  | "explorer"
  | "synth"
  | "calendar"
  | "itunes"
  
  | "bmcoffee"
  | "terminal"
  | "recruiter"
  
  

export interface AppMeta {
  id: AppId
  title: string
}

export interface AppIcon {
  id: AppId
  title: string
  iconUrl?: string
  iconComponent?: ComponentType<any>
  // ✅ now accepts optional props
  launch: (props?: Record<string, unknown>) => void
  pinned?: boolean
  x: number
  y: number
}

export interface AppsSlice {
  apps: Record<AppId, AppMeta>
  desktopIcons: AppIcon[]
  setDesktopIcons: (icons: AppIcon[]) => void

  trash: AppIcon[]
  setTrash: (entries: AppIcon[]) => void

  // ✅ Global helpers
  moveToTrash: (icon: AppIcon) => void
  restoreFromTrash: (id: string) => void
  emptyTrash: () => void

  pinApp: (id: AppId) => void
  unpinApp: (id: AppId) => void
  moveDesktopIcon: (id: AppId, x: number, y: number) => void
}

const APPS: Record<AppId, AppMeta> = {
  finder: { id: "finder", title: "Finder" },
  guestbook: { id: "guestbook", title: "iguest" },
  games: { id: "games", title: "igames" },
  wallpapers: { id: "wallpapers", title: "iwallpapers" },
  explorer: { id: "explorer", title: "iweb" },
  synth: { id: "synth", title: "Synth" },
  calendar: { id: "calendar", title: "ical" },
    recruiter: { id: "recruiter", title: "iprojects" },
  itunes: { id: "itunes", title: "itunes" },
  terminal: { id: "terminal", title: "Terminal" },
   bmcoffee: { id: "bmcoffee", title: "Buy Me Coffee" },
  

}

const PINNED_DEFAULT: AppId[] = [
  "finder",
  "games",
  "guestbook",
  "wallpapers",
  "terminal",
  "explorer",
]

export const createAppsSlice: StateCreator<AppsSlice> = (set, get) => {
  const makeLaunch = (appId: AppId) => (props?: Record<string, unknown>) => {
    const anyGet = get() as unknown as {
      openWindow: (w: {
        id: string
        appKey: AppId
        x: number
        y: number
        width: number
        height: number
        minimized: boolean
        zoomed: boolean
        props?: Record<string, unknown>
      }) => void
      focusWindow: (id: string) => void
    }

    const id = `${appId}-${Math.random().toString(36).slice(2)}`
    const width = 560
    const height = 400
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280
    const vh = typeof window !== "undefined" ? window.innerHeight : 720
    const x = Math.max(16, Math.floor((vw - width) / 2))
    const y = Math.max(48, Math.floor((vh - height) / 3))

    anyGet.openWindow({
      id,
      appKey: appId,
      x,
      y,
      width,
      height,
      minimized: false,
      zoomed: false,
      props, // ✅ forward props (used by Finder)
    })
    anyGet.focusWindow(id)
  }

  const makeIcon = (id: AppId, index: number): AppIcon => {
    const col = Math.floor(index / 6)
    const row = index % 6
    return {
      id,
      title: APPS[id].title,
      iconUrl: id === "calendar" ? undefined : `/icons/${id}.png`,
      iconComponent: id === "calendar" ? CalendarIcon : undefined,
      pinned: PINNED_DEFAULT.includes(id),
      launch: makeLaunch(id),
      x: 80 + col * 100,
      y: 100 + row * 100,
    }
  }

  const initialIcons: AppIcon[] = (Object.keys(APPS) as AppId[]).map(
    (id, idx) => makeIcon(id, idx)
  )

  return {
    apps: APPS,
    desktopIcons: initialIcons,
    setDesktopIcons: (icons) => set({ desktopIcons: icons }),

    trash: [],
    setTrash: (entries) => set({ trash: entries }),

    // ✅ Global helpers
    moveToTrash: (icon) =>
      set((state) => ({
        desktopIcons: state.desktopIcons.filter((i) => i.id !== icon.id),
        trash: [...state.trash, icon],
      })),

    restoreFromTrash: (id) =>
      set((state) => {
        const item = state.trash.find((t) => t.id === id)
        if (!item) return state
        return {
          desktopIcons: [...state.desktopIcons, item],
          trash: state.trash.filter((t) => t.id !== id),
        }
      }),

    emptyTrash: () => set({ trash: [] }),

    pinApp: (id) =>
      set((state) => ({
        desktopIcons: state.desktopIcons.map((icon) =>
          icon.id === id ? { ...icon, pinned: true } : icon
        ),
      })),

    unpinApp: (id) =>
      set((state) => ({
        desktopIcons: state.desktopIcons.map((icon) =>
          icon.id === id ? { ...icon, pinned: false } : icon
        ),
      })),

    moveDesktopIcon: (id, x, y) =>
      set((state) => ({
        desktopIcons: state.desktopIcons.map((icon) =>
          icon.id === id ? { ...icon, x, y } : icon
        ),
      })),
  }
}
