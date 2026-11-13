import { useState } from 'react'
import { Button, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { RadioRow } from '../components/RadioRow'
import { SettingsSection } from '../components/SettingsSection'
import { useSettings, useUpdateSettings } from '../hooks/queries'
import type { LanguageCode } from '../types'

const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yorùbá' },
  { value: 'ig', label: 'Igbo' },
]

const isLanguage = (value: string | undefined): value is LanguageCode =>
  LANGUAGES.some((option) => option.value === value)

/**
 * Settings → Language (no dedicated Figma frame; follows the App Theme pattern). Saved to the
 * member's settings; the app itself is English-only for now.
 */
export function LanguageSettingsPage() {
  const settings = useSettings()
  const update = useUpdateSettings()
  const toast = useToast()
  const [draft, setDraft] = useState<LanguageCode | null>(null)
  const saved = settings.data?.language
  const current = draft ?? (isLanguage(saved) ? saved : 'en')

  return (
    <SettingsSection title="Language" className="gap-[27px] px-1">
      <fieldset className="flex flex-col gap-3 border-b border-hairline px-5 py-2.5">
        <legend className="mb-3.5 text-body-m font-semibold text-fg">Choose the language you want to use.</legend>
        {LANGUAGES.map((option) => (
          <RadioRow
            key={option.value}
            name="language"
            size="sm"
            value={option.value}
            label={option.label}
            checked={current === option.value}
            onChange={(value) => setDraft(value as LanguageCode)}
          />
        ))}
      </fieldset>
      <div className="px-[30px] py-2">
        <Button
          disabled={!draft || draft === saved}
          loading={update.isPending}
          onClick={() =>
            draft &&
            update.mutate(
              { language: draft },
              {
                onSuccess: () => {
                  setDraft(null)
                  toast('Language updated')
                },
                onError: (error) => toast(getErrorMessage(error)),
              },
            )
          }
          className="h-[38px] rounded-full bg-brand-orange font-normal"
        >
          Save
        </Button>
      </div>
    </SettingsSection>
  )
}
