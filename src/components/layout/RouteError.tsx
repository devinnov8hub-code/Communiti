import { ArrowClockwise, House } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import logoMark from '@/assets/brand/logo-mark.svg'
import { Button, ErrorState } from '@/components/ui'
import { isStaleBundleError } from '@/lib/errorDisplay'

const RELOADED_KEY = 'communiti:stale-bundle-reload'

/**
 * Shown instead of a screen that crashed while loading or rendering (React Router `errorElement`).
 * `inline` keeps the app's sidebar and navigation around it; otherwise it fills the page.
 */
export function RouteError({ homeTo = '/', inline = false }: { homeTo?: string; inline?: boolean }) {
  const error = useRouteError()
  const stale = isStaleBundleError(error)
  const notFound = isRouteErrorResponse(error) && error.status === 404

  useEffect(() => {
    if (import.meta.env.DEV) console.error('[route error]', error)
  }, [error])

  // After a deploy, the open tab asks for files that were replaced. One automatic reload fixes it;
  // the timestamp stops a reload loop if the files really are missing (at most once a minute).
  useEffect(() => {
    if (!stale) return
    try {
      const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0)
      if (Date.now() - last < 60_000) return
      sessionStorage.setItem(RELOADED_KEY, String(Date.now()))
      window.location.reload()
    } catch {
      // Storage blocked: leave it to the Reload button.
    }
  }, [stale])

  const state = (
    <ErrorState
      error={error}
      title={notFound ? 'We couldn’t find that page' : 'This page ran into a problem'}
      message={
        notFound
          ? 'The link may be wrong, or the page may have moved.'
          : stale
            ? undefined
            : 'Something on this page stopped working. Reloading usually fixes it. If it keeps happening, let us know.'
      }
      actions={
        <>
          {!notFound && (
            <Button
              fullWidth={false}
              onClick={() => window.location.reload()}
              className="h-10 rounded-full bg-brand-orange px-5 text-body-m"
            >
              <ArrowClockwise aria-hidden weight="bold" className="size-4" />
              Reload page
            </Button>
          )}
          <Link
            to={homeTo}
            reloadDocument
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border-default bg-surface px-5 text-body-m font-semibold text-fg hover:bg-fg/[0.03]"
          >
            <House aria-hidden className="size-4" />
            Go to home
          </Link>
        </>
      }
    >
      {import.meta.env.DEV && error instanceof Error && (
        <details className="mt-2 w-full rounded-control border border-hairline bg-surface-raised p-3 text-left">
          <summary className="cursor-pointer text-caption font-semibold text-fg-muted">
            Details (development only)
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto text-caption whitespace-pre-wrap text-fg-muted">
            {error.stack ?? error.message}
          </pre>
        </details>
      )}
    </ErrorState>
  )

  if (inline) return <div className="flex flex-1 items-center justify-center">{state}</div>

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface px-4 py-10">
      <img src={logoMark} alt="CommUniti" width={48} height={48} className="size-12" />
      <div className="w-full max-w-lg rounded-modal bg-surface-raised shadow-card">{state}</div>
    </main>
  )
}
