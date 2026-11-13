import { useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { RadioRow } from '../components/RadioRow'
import { SettingsGroup, SettingsSection } from '../components/SettingsSection'
import { useSettings, useUpdateSettings } from '../hooks/queries'
import type { MessagePermission } from '../types'

/** The backend's choices (`messagePermission`); "following" means people the member follows. */
const MESSAGE_OPTIONS: { value: MessagePermission; label: string }[] = [
  { value: 'none', label: 'No one' },
  { value: 'following', label: 'People I follow' },
  { value: 'everyone', label: 'Anyone' },
]

/**
 * Settings → Visibility. Changes save immediately. The design's "Allow collaboration requests
 * from" isn't in the backend yet, so it isn't shown (README → Settings).
 */
export function VisibilitySettingsPage() {
  const settings = useSettings()
  const update = useUpdateSettings()
  const toast = useToast()

  const change = (messagePermission: MessagePermission) =>
    update.mutate(
      { messagePermission },
      { onSuccess: () => toast('Visibility updated'), onError: (error) => toast(getErrorMessage(error)) },
    )

  return (
    <SettingsSection title="Visibility" className="px-3 lg:pl-3">
      {settings.data ? (
        <SettingsGroup title="Who can message me" className="px-5">
          <div role="radiogroup" aria-label="Who can message me" className="flex flex-col gap-2.5">
            {MESSAGE_OPTIONS.map((option) => (
              <RadioRow
                key={option.value}
                name="messages"
                value={option.value}
                label={option.label}
                checked={settings.data.messagePermission === option.value}
                onChange={(value) => change(value as MessagePermission)}
              />
            ))}
          </div>
        </SettingsGroup>
      ) : settings.isError ? (
        <p className="px-5 text-body-m text-fg-muted">{getErrorMessage(settings.error)}</p>
      ) : (
        <div className="h-72 animate-pulse rounded-card bg-surface" />
      )}
    </SettingsSection>
  )
}
