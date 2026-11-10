import { CalendarDots, DotsThree, NavigationArrow, ShareNetwork } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDateRange } from '@/lib/format'
import type { ExploreEvent } from '../types'

/** Event tile with image and details panel (Figma "web event admin"). */
export function EventCard({ event, className }: { event: ExploreEvent; className?: string }) {
  const toast = useToast()
  const url = paths.event(event.id)

  const share = async () => {
    const link = `${window.location.origin}${url}`
    try {
      if (navigator.share) await navigator.share({ title: event.title, url: link })
      else {
        await navigator.clipboard.writeText(link)
        toast('Link copied to clipboard')
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <article
      className={cn('relative flex h-[335px] flex-col justify-end rounded-control border border-hairline', className)}
    >
      {event.coverUrl ? (
        <img
          src={event.coverUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full rounded-control object-cover"
        />
      ) : (
        <span aria-hidden className="absolute inset-0 rounded-control bg-surface" />
      )}
      <div className="relative flex flex-col gap-[7px] rounded-b-control bg-popover p-2">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-brand-orange-tint px-2 py-[5px] text-caption text-brand-orange uppercase">
            {event.category}
          </span>
          <Menu
            trigger={
              <IconButton label="Event options" className="relative z-10 size-[18px] text-fg">
                <DotsThree weight="bold" className="size-[18px]" />
              </IconButton>
            }
          >
            {(close) => (
              <MenuItem
                icon={<ShareNetwork />}
                onSelect={() => {
                  close()
                  share()
                }}
              >
                Share
              </MenuItem>
            )}
          </Menu>
        </div>
        <h3 className="text-body-m font-semibold text-fg">
          {/* Stretched link: the whole card opens the event. */}
          <Link to={url} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        <p className="text-caption text-fg-muted">{event.summary}</p>
        <div className="flex flex-col gap-[7px] text-caption text-fg">
          <span className="flex items-center gap-[3px]">
            <CalendarDots aria-hidden className="size-6 text-brand-orange" />
            {formatDateRange(event.startsAt, event.endsAt)}
          </span>
          <span className="flex items-center gap-[3px]">
            <NavigationArrow aria-hidden className="size-6 text-brand-orange" />
            {event.location}
          </span>
        </div>
      </div>
    </article>
  )
}
