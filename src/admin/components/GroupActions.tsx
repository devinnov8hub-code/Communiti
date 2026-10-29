import { DotsThree } from '@phosphor-icons/react'
import { useState } from 'react'
import { ConfirmDialog, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import type { AdminSetForumStatusBody } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { useSetContentRemoved, useSetGroupStatus } from '../hooks/queries'

type ModerationStatus = 'active' | 'flagged' | 'restricted' | 'suspended'

interface Item {
  key: string
  label: string
  tone?: 'warning' | 'danger'
  done: string
  /** A status change, or delete / restore. */
  run: { status: AdminSetForumStatusBody['action'] } | { removed: boolean }
  /** Asks first, with a reason box. */
  confirm?: { title: string; message: string; label: string }
}

/**
 * Row actions for a forum or project in the admin tables: warn, restrict, suspend,
 * reinstate, delete and restore. Every heavy action asks for a reason.
 */
export function GroupActions({
  type,
  id,
  name,
  status,
  removed,
}: {
  type: 'forum' | 'project'
  id: string
  name: string
  status: ModerationStatus
  removed: boolean
}) {
  const setStatus = useSetGroupStatus(type)
  const setRemoved = useSetContentRemoved(type)
  const toast = useToast()
  const [confirming, setConfirming] = useState<Item | null>(null)
  const noun = type === 'forum' ? 'forum' : 'project'

  const items: Item[] = removed
    ? [{ key: 'restore', label: `Restore ${noun}`, done: 'restored', run: { removed: false } }]
    : [
        ...(status !== 'active'
          ? [{ key: 'reinstate', label: 'Reinstate', done: 'reinstated', run: { status: 'reinstate' } } as Item]
          : []),
        ...(status === 'flagged'
          ? []
          : [
              {
                key: 'warn',
                label: 'Send warning',
                tone: 'warning',
                done: 'warned',
                run: { status: 'warn' },
                confirm: {
                  title: `Warn ${name}?`,
                  message: `The ${noun} owner is told why. Repeated warnings can lead to suspension.`,
                  label: 'Send warning',
                },
              } as Item,
            ]),
        ...(status === 'restricted' || status === 'suspended'
          ? []
          : [
              {
                key: 'restrict',
                label: 'Restrict',
                tone: 'warning',
                done: 'restricted',
                run: { status: 'restrict' },
                confirm: {
                  title: `Restrict ${name}?`,
                  message: `Members can still see this ${noun}, but can’t post in it until it’s reinstated.`,
                  label: 'Restrict',
                },
              } as Item,
            ]),
        ...(status === 'suspended'
          ? []
          : [
              {
                key: 'suspend',
                label: `Suspend ${noun}`,
                tone: 'danger',
                done: 'suspended',
                run: { status: 'suspend' },
                confirm: {
                  title: `Suspend ${name}?`,
                  message: `Members won’t be able to use this ${noun} until an admin reinstates it.`,
                  label: 'Suspend',
                },
              } as Item,
            ]),
        {
          key: 'delete',
          label: `Delete ${noun}`,
          tone: 'danger',
          done: 'deleted',
          run: { removed: true },
          confirm: {
            title: `Delete ${name}?`,
            message: `Members will no longer see this ${noun} or its content. You can restore it later.`,
            label: 'Delete',
          },
        },
      ]

  const onDone = (item: Item) => ({
    onSuccess: () => {
      toast(`${name} ${item.done}`)
      setConfirming(null)
    },
    onError: (error: unknown) => toast(getErrorMessage(error)),
  })

  const run = (item: Item, reason = '') => {
    if ('status' in item.run) {
      setStatus.mutate({ id, data: { action: item.run.status, ...(reason && { reason }) } }, onDone(item))
    } else {
      setRemoved.mutate({ id, removed: item.run.removed, note: reason || undefined }, onDone(item))
    }
  }

  return (
    <>
      <Menu
        trigger={
          <IconButton label={`Actions for ${name}`} className="size-7 text-fg">
            <DotsThree weight="bold" className="size-[18px]" />
          </IconButton>
        }
        className="w-[200px]"
      >
        {(close) =>
          items.map((item) => (
            <MenuItem
              key={item.key}
              size="sm"
              tone={item.tone}
              onSelect={() => {
                close()
                if (item.confirm) setConfirming(item)
                else run(item)
              }}
            >
              {item.label}
            </MenuItem>
          ))
        }
      </Menu>
      <ConfirmDialog
        open={confirming !== null}
        withReason
        title={confirming?.confirm?.title ?? ''}
        message={confirming?.confirm?.message ?? ''}
        confirmLabel={confirming?.confirm?.label ?? ''}
        loading={setStatus.isPending || setRemoved.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={(reason) => confirming && run(confirming, reason)}
      />
    </>
  )
}
