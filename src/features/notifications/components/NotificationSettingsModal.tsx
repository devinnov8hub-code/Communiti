import { CaretRight } from '@phosphor-icons/react'
import { Modal, RadioMark, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { useMarkAllRead, useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks/queries'
import type { NotificationCategory } from '../types'

const CATEGORIES: { value: NotificationCategory; label: string }[] = [
  { value: 'collaborations', label: 'Collaborations' },
  { value: 'posts', label: 'Posts' },
  { value: 'forums', label: 'Forums' },
]
const ALL: NotificationCategory[] = ['messages', 'collaborations', 'posts', 'forums']

/** "Notification settings" sheet. Mute options are independent toggles. */
export function NotificationSettingsModal({ onClose }: { onClose: () => void }) {
  const preferences = useNotificationPreferences()
  const update = useUpdateNotificationPreferences()
  const markAll = useMarkAllRead()
  const toast = useToast()
  const muted = preferences.data?.muted ?? []
  const allMuted = ALL.every((category) => muted.includes(category))
  const onError = (error: unknown) => toast(getErrorMessage(error))

  const setMuted = (next: NotificationCategory[]) => update.mutate({ muted: next }, { onError })
  const toggle = (category: NotificationCategory) =>
    setMuted(muted.includes(category) ? muted.filter((item) => item !== category) : [...muted, category])

  return (
    <Modal open onClose={onClose} title="Notification settings" className="[&_h2]:text-body-l">
      <button
        type="button"
        onClick={() => markAll.mutate(undefined, { onSuccess: () => toast('All caught up'), onError })}
        className="-mt-2 flex w-full items-center justify-between gap-3 border-b border-surface py-2.5 text-left hover:opacity-80"
      >
        <span className="flex flex-col">
          <span className="text-body-s font-semibold text-fg">Mark all as read</span>
          <span className="text-caption text-fg-muted">Clear all pending notifications</span>
        </span>
        <CaretRight aria-hidden className="size-[18px] text-fg-muted" />
      </button>

      <div className="flex flex-col gap-2">
        <p className="text-body-m font-semibold text-fg-muted">Mute notifications from</p>
        {[{ value: 'all' as const, label: 'Mute all' }, ...CATEGORIES].map((option) => {
          const checked = option.value === 'all' ? allMuted : muted.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={checked}
              disabled={update.isPending}
              onClick={() => (option.value === 'all' ? setMuted(allMuted ? [] : ALL) : toggle(option.value))}
              className="flex items-center justify-between border-b border-surface py-2.5 text-left last:border-b-0"
            >
              <span className="text-body-s font-semibold text-fg">{option.label}</span>
              <RadioMark checked={checked} />
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
