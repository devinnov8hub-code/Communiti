import { RadioMark } from '@/components/ui'

interface RadioRowProps {
  name: string
  value: string
  checked: boolean
  label: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
}

/** Label on the left, orange Material-style radio on the right. */
export function RadioRow({ name, value, checked, label, onChange, size = 'md' }: RadioRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-[5px]">
      <span className={size === 'sm' ? 'text-body-s text-fg' : 'text-body-m text-fg'}>{label}</span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span className="rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-brand-green">
        <RadioMark checked={checked} />
      </span>
    </label>
  )
}
