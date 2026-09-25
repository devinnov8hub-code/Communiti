import { ArrowLeft } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { cn } from '@/lib/cn'

interface SettingsSectionProps {
  title: string
  /** Show a back arrow (sub-pages like Delete Account, and always on small screens). */
  backTo?: string
  children: ReactNode
  className?: string
}

/** Section title bar + content column used by every settings page. */
export function SettingsSection({ title, backTo, children, className }: SettingsSectionProps) {
  const back = backTo ?? paths.settings
  return (
    <section className="flex flex-col gap-[27px] pb-10">
      <header className="flex items-center gap-2.5 border-b border-hairline py-2.5 pr-2.5 pl-4 lg:pl-[22px]">
        <Link
          to={back}
          aria-label="Back"
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full bg-fg/5 text-fg hover:bg-fg/10',
            !backTo && 'lg:hidden',
          )}
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-h3 font-semibold text-fg">{title}</h1>
      </header>
      <div className={cn('flex w-full max-w-[823px] flex-col px-4 lg:pr-5 lg:pl-[22px]', className)}>{children}</div>
    </section>
  )
}

/** Group heading + rows, separated by a hairline (Figma "System Permissions", "Others"…). */
export function SettingsGroup({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-gap-sm border-b border-hairline px-4 py-2.5 last:border-b-0', className)}>
      <h2 className="text-body-m font-semibold text-fg">{title}</h2>
      {children}
    </div>
  )
}
