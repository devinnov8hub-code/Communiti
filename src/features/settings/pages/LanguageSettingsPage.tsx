import { useState } from 'react'
import { Button, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { RadioRow } from '../components/RadioRow'
import { SettingsSection } from '../components/SettingsSection'
import { useLanguage, useUpdateLanguage } from '../hooks/queries'
import type { LanguageCode } from '../types'

const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yorùbá' },
  { value: 'ig', label: 'Igbo' },
]

/** Settings → Language (no dedicated Figma frame; follows the App Theme pattern). */
export function LanguageSettingsPage() {
  const language = useLanguage()
  const update = useUpdateLanguage()
  const toast = useToast()
  const [draft, setDraft] = useState<LanguageCode | null>(null)
  const current = draft ?? language.data ?? 'en'

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
          disabled={!draft || draft === language.data}
          loading={update.isPending}
          onClick={() =>
            draft &&
            update.mutate(draft, {
              onSuccess: () => {
                setDraft(null)
                toast('Language updated')
              },
              onError: (error) => toast(getErrorMessage(error)),
            })
          }
          className="h-[38px] rounded-full bg-brand-orange font-normal"
        >
          Save
        </Button>
      </div>
    </SettingsSection>
  )
}
