import { Button } from '@/components/ui'

export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[28px]">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-[124px] animate-pulse rounded-modal bg-surface-raised" />
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-body-m text-fg-muted">{message}</p>
      <Button variant="outline" fullWidth={false} className="h-10 rounded-full text-body-m" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
