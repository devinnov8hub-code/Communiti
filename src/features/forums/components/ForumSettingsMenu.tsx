import { GearSix, PencilSimple, SignOut, Trash } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { IconButton, Menu, MenuRadioItem, useToast } from '@/components/ui'
import type { Forum } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { useLeaveForum, useMuteForum } from '../hooks/queries'

interface ForumSettingsMenuProps {
  forum: Forum
  onEdit: () => void
  onDelete: () => void
}

/** Gear menu on a joined forum (Figma "Forumn more"), plus Edit / Delete for owners and moderators. */
export function ForumSettingsMenu({ forum, onEdit, onDelete }: ForumSettingsMenuProps) {
  const mute = useMuteForum()
  const leave = useLeaveForum()
  const toast = useToast()
  const onError = (error: unknown) => toast(getErrorMessage(error))
  const canEdit = forum.myRole === 'owner' || forum.myRole === 'moderator'

  return (
    <Menu
      className="w-[min(350px,calc(100vw-32px))] rounded-search"
      trigger={
        <IconButton label="Forum settings" className="size-10 bg-fg/5 p-2 hover:bg-fg/10">
          <GearSix className="size-6 text-fg" />
        </IconButton>
      }
    >
      {(close) => {
        const run = (action: () => void) => () => {
          close()
          action()
        }
        return (
          <>
            <MenuRadioItem
              checked={forum.isMuted}
              onSelect={() =>
                mute.mutate(
                  { id: forum.id, muted: !forum.isMuted },
                  {
                    onSuccess: (updated) => toast(updated.isMuted ? 'Notifications muted' : 'Notifications unmuted'),
                    onError,
                  },
                )
              }
            >
              <span className="text-body-s font-semibold text-fg-muted">Mute notifications &amp; messages</span>
            </MenuRadioItem>
            {canEdit && (
              <Row
                title="Edit Forum"
                hint="change the name, header, focus topics or about"
                icon={<PencilSimple />}
                onSelect={run(onEdit)}
              />
            )}
            {forum.myRole === 'owner' ? (
              // The owner can't leave their own forum; they can delete it instead.
              <Row
                danger
                title="Delete Forum"
                hint="remove this forum and its posts for everyone"
                icon={<Trash />}
                onSelect={run(onDelete)}
              />
            ) : (
              <Row
                danger
                title="Leave Forum"
                hint="leave this forum, all your messages would remain"
                icon={<SignOut />}
                onSelect={run(() => leave.mutate(forum.id, { onSuccess: () => toast('You left the forum'), onError }))}
              />
            )}
          </>
        )
      }}
    </Menu>
  )
}

interface RowProps {
  title: string
  hint: string
  icon: ReactNode
  danger?: boolean
  onSelect: () => void
}

function Row({ title, hint, icon, danger, onSelect }: RowProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="mt-4 flex w-full items-center justify-between gap-3 bg-surface px-1 py-2.5 text-left hover:opacity-80"
    >
      <span className="flex flex-col">
        <span className={cn('text-body-s font-semibold', danger ? 'text-error' : 'text-fg')}>{title}</span>
        <span className="text-caption text-fg-muted">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn('flex size-[18px] shrink-0 [&>svg]:size-[18px]', danger ? 'text-error' : 'text-fg')}
      >
        {icon}
      </span>
    </button>
  )
}
