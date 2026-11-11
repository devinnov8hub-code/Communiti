import notificationsIllustration from '@/assets/workspace/notifications-illustration.webp'
import { Modal, Switch, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { useNotificationPrefs, useUpdateNotificationPrefs } from '../hooks/queries'
import type { ProjectNotificationSettings } from '@/lib/api'

// The backend's per-project options (the design's four labels don't map onto them).
const OPTIONS: { key: keyof ProjectNotificationSettings; label: string }[] = [
  { key: 'chat', label: 'Project Chat' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'research', label: 'Research' },
  { key: 'prototypes', label: 'Prototypes' },
  { key: 'evaluations', label: 'Expert Evaluations' },
  { key: 'members', label: 'Members & Requests' },
]

/** Per-project notification toggles (Figma "notifications"). */
export function ProjectNotificationsModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const prefs = useNotificationPrefs(projectId)
  const update = useUpdateNotificationPrefs(projectId)
  const toast = useToast()

  return (
    <Modal open onClose={onClose} title="Notifications">
      <img src={notificationsIllustration} alt="" width={305} height={229} className="mx-auto w-[240px] sm:w-[305px]" />
      <p className="text-body-s text-fg-body">
        Manage your notification preferences to stay updated on projects, tasks, messages, and important activities.
      </p>
      <ul className="-mt-2 flex flex-col">
        {OPTIONS.map((option) => (
          <li
            key={option.key}
            className="flex items-center justify-between gap-4 border-b border-hairline py-3 last:border-b-0"
          >
            <span className="text-body-s text-fg">{option.label}</span>
            <Switch
              label={option.label}
              checked={prefs.data ? prefs.data[option.key] !== false : false}
              disabled={!prefs.data}
              onChange={(checked) =>
                prefs.data &&
                update.mutate(
                  { ...prefs.data, [option.key]: checked },
                  { onError: (error) => toast(getErrorMessage(error)) },
                )
              }
            />
          </li>
        ))}
      </ul>
    </Modal>
  )
}
