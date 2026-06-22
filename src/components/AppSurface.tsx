import { Suspense, type ComponentType } from "react"
import { AppRegistry } from "../apps/registry/registry"
import type { AppId } from "../store/apps"

type AppSurfaceProps = {
  /** Which registry app to render. */
  appKey: AppId
  /** Optional props forwarded to the app component. */
  appProps?: Record<string, unknown>
  /** Fallback shown while the lazy app chunk loads. */
  fallback?: React.ReactNode
}

function DefaultSurfaceFallback() {
  return (
    <div
      className="flex h-full w-full items-center justify-center gap-3 bg-white text-sm text-gray-500"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 motion-reduce:animate-none"
        aria-hidden="true"
      />
      Loading…
    </div>
  )
}

/**
 * Windowing-agnostic renderer for a registry app.
 *
 * `AppSurface` resolves an app's (lazy) component from `AppRegistry` and renders
 * it inside a `<Suspense>` boundary, knowing nothing about *how* it is presented.
 * The shell decides the container:
 *   - DesktopShell renders apps inside a draggable `Window` (which already does
 *     this resolution itself — see Window.tsx).
 *   - Tablet/Mobile shells render `<AppSurface>` directly in a full-bleed pane.
 *
 * This is the seam that lets one app run as a window, a pane, or a full-screen
 * view without any change to the app's own code.
 */
export default function AppSurface({
  appKey,
  appProps,
  fallback,
}: AppSurfaceProps) {
  const appMeta = AppRegistry[appKey] ?? null
  const AppComponent = appMeta?.component as ComponentType<Record<string, unknown>> | null

  if (!AppComponent) {
    return <div className="p-4 text-sm text-gray-500">No app found: {appKey}</div>
  }

  return (
    <Suspense fallback={fallback ?? <DefaultSurfaceFallback />}>
      <AppComponent {...(appProps ?? {})} />
    </Suspense>
  )
}
