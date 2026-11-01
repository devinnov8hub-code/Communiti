import { cn } from '@/lib/cn'

interface VerifyTickProps {
  active: boolean
  className?: string
}

/** The check at the end of a field: a grey outline until `active`, then the green tick animates in. */
export function VerifyTick({ active, className }: VerifyTickProps) {
  return (
    <svg
      aria-hidden
      data-active={active}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-6 shrink-0 overflow-visible', className)}
    >
      {active ? (
        <>
          <circle
            cx="12"
            cy="12"
            r="10"
            strokeWidth="1.5"
            className="origin-center animate-tick-ring stroke-brand-green [transform-box:fill-box] motion-reduce:hidden"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            className="origin-center animate-tick-pop fill-brand-green [transform-box:fill-box] motion-reduce:animate-none"
          />
          <path
            d="m7.5 12.5 3 3 6-6.5"
            pathLength={1}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-tick-draw stroke-white [stroke-dasharray:1] motion-reduce:animate-none"
          />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9.25" strokeWidth="1.5" className="stroke-grey-30" />
          <path
            d="m7.5 12.5 3 3 6-6.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-grey-30"
          />
        </>
      )}
    </svg>
  )
}
