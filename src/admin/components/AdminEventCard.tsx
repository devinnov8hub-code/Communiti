import { CalendarDots, DotsThree, Eye, NavigationArrow, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDateRange } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useDeleteEvent } from '../hooks/queries'
import { adminPaths } from '../paths'
import type { AdminEvent } from '../types'

/** Admin event tile: image on top, details below (Figma "EVENTS PAGE" cards). */
export function AdminEventCard({ event, className }: { event: AdminEvent; className?: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = useDeleteEvent()
  const toast = useToast()
  const navigate = useNavigate()
  const url = adminPaths.event(event.id)

  return (
    <article className={cn('relative flex flex-col rounded-control bg-surface-raised', className)}>
      <img src={event.imageUrl} alt="" loading="lazy" className="h-[162px] w-full rounded-t-control object-cover" />
      <div className="flex flex-col gap-[7px] p-2">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-brand-orange-tint px-2 py-[5px] text-caption text-brand-orange uppercase dark:bg-brand-orange/15">
            {event.category}
          </span>
          <Menu
            trigger={
              <IconButton label={`Options for ${event.title}`} className="relative z-10 size-6 text-fg">
                <DotsThree weight="bold" className="size-[18px]" />
              </IconButton>
            }
            className="w-[200px]"
          >
            {(close) => (
              <>
                <MenuItem
                  size="sm"
                  icon={<Eye />}
                  onSelect={() => {
                    close()
                    navigate(url)
                  }}
                >
                  View event
                </MenuItem>
                <MenuItem
                  size="sm"
                  tone="danger"
                  icon={<Trash />}
                  onSelect={() => {
                    close()
                    setConfirmDelete(true)
                  }}
                >
                  Delete event
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
        <h3 className="text-body-m font-semibold text-fg">
          {/* Stretched link: the whole card opens the event. */}
          <Link to={url} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-caption text-fg-muted">{event.summary}</p>
        <div className="flex flex-col gap-[7px] text-caption text-fg">
          <span className="flex items-center gap-[3px]">
            <CalendarDots aria-hidden className="size-6 text-brand-orange" />
            {formatDateRange(event.startsAt, event.endsAt)}
          </span>
          <span className="flex items-center gap-[3px]">
            <NavigationArrow aria-hidden className="size-6 -scale-x-100 text-brand-orange" />
            {event.location}
          </span>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete event?"
        message={`“${event.title}” will be removed for everyone.`}
        confirmLabel="Delete event"
        loading={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(event.id, {
            onSuccess: () => {
              setConfirmDelete(false)
              toast('Event deleted')
            },
            onError: (error) => toast(getErrorMessage(error)),
          })
        }
      />
    </article>
  )
}
