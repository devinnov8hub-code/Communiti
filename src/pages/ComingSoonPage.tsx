import { useLocation } from 'react-router-dom'
import { EmptyState } from '@/components/ui'

/** Placeholder for sections whose screens haven't been built yet. */
export function ComingSoonPage() {
  const { pathname } = useLocation()
  const section = pathname.split('/')[1] ?? ''
  const title = section.charAt(0).toUpperCase() + section.slice(1)

  return (
    <main className="flex min-h-[60dvh] items-center justify-center">
      <EmptyState title={title || 'Coming soon'} description="This section is coming soon." />
    </main>
  )
}
