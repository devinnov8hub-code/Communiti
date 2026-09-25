import { ArrowLeft } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconButton } from '@/components/ui'

interface BackHeaderProps {
  title: string
  /** Where to go when there's no history to go back to. */
  fallback: string
  actions?: ReactNode
}

/** Sticky "← Title" header (Figma "post header"). */
export function BackHeader({ title, fallback, actions }: BackHeaderProps) {
  const navigate = useNavigate()
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback))

  return (
    <header className="sticky top-14 z-10 flex items-center gap-[11px] border-b border-hairline bg-background px-4 pt-3.5 pb-5 sm:px-5 md:top-0">
      <IconButton label="Back" onClick={goBack} className="size-10 bg-fg/5 p-2 hover:bg-fg/10">
        <ArrowLeft className="size-6 text-fg" />
      </IconButton>
      <h1 className="min-w-0 flex-1 truncate text-h3 font-semibold text-fg">{title}</h1>
      {actions}
    </header>
  )
}
