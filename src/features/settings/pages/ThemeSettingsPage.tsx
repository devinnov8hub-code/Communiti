import { useState } from 'react'
import { Button, useToast } from '@/components/ui'
import type { ThemePreference } from '@/providers/themeContext'
import { useTheme } from '@/providers/useTheme'
import { RadioRow } from '../components/RadioRow'
import { SettingsSection } from '../components/SettingsSection'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
  { value: 'system', label: 'Use Device Settings' },
]

/** Settings → App Theme. Applies on Save; stored on this device. */
export function ThemeSettingsPage() {
  const { preference, setPreference } = useTheme()
  const [draft, setDraft] = useState<ThemePreference>(preference)
  const toast = useToast()

  return (
    <SettingsSection title="App Theme" className="gap-[27px] px-1">
      <fieldset className="flex flex-col gap-gap-sm border-b border-hairline px-5 py-2.5">
        <legend className="mb-3.5 text-body-m font-semibold text-fg">
          Choose how you would like to experience the app.
        </legend>
        <div className="flex flex-col gap-3">
          {OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              name="theme"
              size="sm"
              value={option.value}
              label={option.label}
              checked={draft === option.value}
              onChange={(value) => setDraft(value as ThemePreference)}
            />
          ))}
        </div>
        <p className="py-2.5 text-body-m text-fg-muted">
          If you select Use Device Settings, this app will follow your device&apos;s appearance settings and switch
          between light and dark mode automatically.
        </p>
      </fieldset>
      <div className="px-[30px] py-2">
        <Button
          disabled={draft === preference}
          onClick={() => {
            setPreference(draft)
            toast('Theme updated')
          }}
          className="h-[38px] rounded-full bg-brand-orange font-normal"
        >
          Save
        </Button>
      </div>
    </SettingsSection>
  )
}
