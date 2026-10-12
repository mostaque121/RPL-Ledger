import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { HouseIcon, RefreshCwIcon, SparklesIcon, TriangleAlertIcon } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { isChunkLoadError, reloadOnce } from '@/lib/chunk-reload'
import { NotFoundPage } from './NotFoundPage'
import { ErrorScreen } from './ErrorScreen'

const detailOf = (error: unknown) =>
  error instanceof Error ? (import.meta.env.DEV && error.stack ? error.stack : error.message) : String(error)

/** What to show for an error: a newer build, or a crash. `home` is false outside the router. */
function ErrorContent({ error, home = true }: { error: unknown; home?: boolean }) {
  const reload = (
    <Button onClick={() => window.location.reload()}>
      <RefreshCwIcon />
      Reload
    </Button>
  )

  if (isChunkLoadError(error)) {
    return (
      <ErrorScreen
        icon={SparklesIcon}
        title="A new version is ready"
        description="The app was updated while this tab was open. Reload to continue — nothing you saved is lost."
      >
        {reload}
      </ErrorScreen>
    )
  }

  return (
    <ErrorScreen
      icon={TriangleAlertIcon}
      title="Something went wrong"
      description="This page hit an unexpected error. Your saved data is safe. Reload to try again, or go back to the dashboard."
      detail={detailOf(error)}
    >
      {reload}
      {home && (
        <Button variant="outline" asChild>
          <Link to="/">
            <HouseIcon />
            Dashboard
          </Link>
        </Button>
      )}
    </ErrorScreen>
  )
}

function useHandledRouteError() {
  const error = useRouteError()
  // A page chunk from the previous build: quietly reload into the new one (once).
  useEffect(() => {
    if (isChunkLoadError(error)) reloadOnce()
  }, [error])
  return error
}

/** A page crashed: the message replaces the page, the sidebar and top bar stay. */
export function PageError() {
  const error = useHandledRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  return <ErrorContent error={error} />
}

/** Outside the app frame (sign-in, or the frame itself failed): full screen. */
export function AppError() {
  const error = useHandledRouteError()
  return (
    <FullScreen>
      <ErrorContent error={error} />
    </FullScreen>
  )
}

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center bg-background p-6">
      <div className="flex flex-col items-center">
        <Logo />
        {children}
      </div>
    </div>
  )
}

/** Last line of defence, around everything (providers included), for errors the router can't catch. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.error === null) return this.props.children
    return (
      <FullScreen>
        <ErrorContent error={this.state.error} home={false} />
      </FullScreen>
    )
  }
}
