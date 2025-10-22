// src/helpers/openAboutApp.ts
import { storeApi } from "../store"
import type { AppId } from "../store/apps"

export function openAboutApp(appKey: AppId) {
  const apps = storeApi.getState().apps
  const desktopIcons = storeApi.getState().desktopIcons

  const app = apps[appKey]
  if (!app) return

  // ✅ find the desktop icon entry for this app
  const icon = desktopIcons.find((i) => i.id === appKey)

  const winId = `aboutapp-${Math.random().toString(36).slice(2)}`
  storeApi.getState().openWindow({
    id: winId,
    appKey: "about-app" as any, // special-case
    x: 0,
    y: 0,
    width: 320,
    height: 240, // fits tighter
    minimized: false,
    zoomed: false,
    props: {
      appKey,
      title: app.title ?? appKey,
      description: `${app.title ?? appKey} is part of Jeff OS X`,
      iconUrl: icon?.iconUrl ?? null, // ✅ pulled from desktopIcons
    },
  })

  storeApi.getState().focusWindow(winId)
}
