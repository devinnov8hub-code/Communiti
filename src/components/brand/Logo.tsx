import lockupDark from '@/assets/brand/logo-lockup-dark.svg'
import lockupLight from '@/assets/brand/logo-lockup-light.svg'
import logoMark from '@/assets/brand/logo-mark.svg'
import { cn } from '@/lib/cn'

/** Compact "Welcome to CommUniti" lockup used on the inner auth steps. */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-[34px] w-[148px] shrink-0', className)}>
      <img
        src={lockupLight}
        alt="Welcome to CommUniti"
        width={148}
        height={34}
        className="block size-full dark:hidden"
      />
      <img
        src={lockupDark}
        alt="Welcome to CommUniti"
        width={148}
        height={34}
        className="hidden size-full dark:block"
      />
    </span>
  )
}

/** Large brand header — logo mark with "Welcome to / CommUniti" (Create account, Login). */
export function BrandWelcome({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-[9px]', className)}>
      <img src={logoMark} alt="" width={52} height={62} className="h-[50px] w-auto shrink-0 sm:h-[62px]" />
      <p className="flex flex-col">
        <span className="text-body-l font-semibold text-fg sm:text-h3">Welcome to</span>
        <span className="text-title-sm font-bold text-brand-orange sm:text-head2">CommUniti</span>
      </p>
    </div>
  )
}
