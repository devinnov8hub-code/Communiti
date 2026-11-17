export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[28px]">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-[124px] animate-pulse rounded-modal bg-surface-raised" />
      ))}
    </div>
  )
}

/** The shared error screen; admin pages import it from here. */
export { ErrorState } from '@/components/ui'
