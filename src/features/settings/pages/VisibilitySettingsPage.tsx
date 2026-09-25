import { useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { RadioRow } from '../components/RadioRow'
import { SettingsGroup, SettingsSection } from '../components/SettingsSection'
import { useUpdateVisibility, useVisibilitySettings } from '../hooks/queries'
import type { CollaborationPermission, MessagePermission, VisibilitySettings } from '../types'

const MESSAGE_OPTIONS: { value: MessagePermission; label: string }[] = [
  { value: 'no-one', label: 'No one' },
  { value: 'collaborators', label: 'Collaborators' },
  { value: 'followers', label: 'Followers' },
  { value: 'anyone', label: 'Anyone' },
]

const COLLAB_OPTIONS: { value: CollaborationPermission; label: string }[] = [
  { value: 'no-one', label: 'No one' },
  { value: 'everyone', label: 'Everyone' },
  { value: 'followers', label: 'Followers only' },
]

/** Settings → Visibility. Changes save immediately. */
export function VisibilitySettingsPage() {
  const visibility = useVisibilitySettings()
  const update = useUpdateVisibility()
  const toast = useToast()

  const change = (patch: Partial<VisibilitySettings>) => {
    if (!visibility.data) return
    update.mutate(
      { ...visibility.data, ...patch },
      { onSuccess: () => toast('Visibility updated'), onError: (error) => toast(getErrorMessage(error)) },
    )
  }

  return (
    <SettingsSection title="Visibility" className="px-3 lg:pl-3">
      {visibility.data ? (
        <>
          <SettingsGroup title="Who can message me" className="px-5">
            <div role="radiogroup" aria-label="Who can message me" className="flex flex-col gap-2.5">
              {MESSAGE_OPTIONS.map((option) => (
                <RadioRow
                  key={option.value}
                  name="messages"
                  value={option.value}
                  label={option.label}
                  checked={visibility.data.messages === option.value}
                  onChange={(value) => change({ messages: value as MessagePermission })}
                />
              ))}
            </div>
          </SettingsGroup>
          <SettingsGroup title="Allow collaboration requests from" className="px-5">
            <div role="radiogroup" aria-label="Allow collaboration requests from" className="flex flex-col gap-2.5">
              {COLLAB_OPTIONS.map((option) => (
                <RadioRow
                  key={option.value}
                  name="collaboration"
                  value={option.value}
                  label={option.label}
                  checked={visibility.data.collaborationRequests === option.value}
                  onChange={(value) => change({ collaborationRequests: value as CollaborationPermission })}
                />
              ))}
            </div>
          </SettingsGroup>
        </>
      ) : (
        <div className="h-72 animate-pulse rounded-card bg-surface" />
      )}
    </SettingsSection>
  )
}
