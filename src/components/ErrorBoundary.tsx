import React from "react"

/**
 * Generic error boundary (Phase 6 / HLD §4 gap).
 *
 * Wrap per-app windows and per-shell roots so one component's runtime error
 * doesn't blank the whole OS. Renders a minimal recovery UI and a "try again"
 * that remounts the subtree.
 */
type Props = {
  children: React.ReactNode
  /** Short label for what failed, e.g. the app/section name. */
  label?: string
  /** Optional custom fallback. */
  fallback?: (reset: () => void, error: Error) => React.ReactNode
}
type State = { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO(Phase 6 observability): forward to the error beacon (HLD §12).
    console.error(`[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ""}]`, error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.reset, this.state.error)
      return (
        <div
          role="alert"
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            {this.props.label ? `${this.props.label} hit a snag.` : "Something went wrong."}
          </p>
          <button
            onClick={this.reset}
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
