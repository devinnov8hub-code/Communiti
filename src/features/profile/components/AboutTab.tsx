import { Image as ImageIcon, PlugsConnected } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface AboutTabProps {
  postsCount: number
  /** Undefined while the projects are loading. */
  projectsCount?: number
}

/**
 * Profile "About" (Figma "Profile About"). The design's Skills and Experience sections are hidden
 * until the backend supports them (README → Profile).
 */
export function AboutTab({ postsCount, projectsCount }: AboutTabProps) {
  return (
    <div className="flex flex-col items-center gap-gap-sm pt-2.5">
      <section className="flex w-full flex-col gap-1.5 border-b border-hairline px-3 py-2.5">
        <div className="flex items-center justify-center gap-gap-md">
          <Stat icon={<ImageIcon className="size-6" />} value={postsCount} label="Posts" />
          <span aria-hidden className="h-[33px] w-px bg-hairline" />
          <Stat icon={<PlugsConnected className="size-6" />} value={projectsCount} label="Projects" />
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: ReactNode; value?: number; label: string }) {
  return (
    <div className="flex w-[74px] flex-col items-center text-center text-body-s text-grey-50 dark:text-grey-30">
      <span className="text-fg">{icon}</span>
      <span>{value ?? '–'}</span>
      <span>{label}</span>
    </div>
  )
}
