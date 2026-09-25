import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length: number
  invalid?: boolean
  disabled?: boolean
  autoFocus?: boolean
  'aria-describedby'?: string
}

/** One box per digit with auto-advance, backspace navigation and paste support. */
export function OtpInput({
  value,
  onChange,
  length,
  invalid,
  disabled,
  autoFocus,
  'aria-describedby': describedBy,
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  const focus = (index: number) => {
    const target = inputs.current[Math.max(0, Math.min(index, length - 1))]
    target?.focus()
    target?.select()
  }

  const setDigit = (index: number, digit: string) => {
    const next = [...digits]
    next[index] = digit
    onChange(next.join('').slice(0, length))
  }

  const handleInput = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) return
    if (typed.length > 1) {
      // Autofill (e.g. iOS one-time-code) can drop the whole code into one box.
      fill(index, typed)
      return
    }
    setDigit(index, typed)
    focus(index + 1)
  }

  const fill = (start: number, text: string) => {
    const next = [...digits]
    text
      .slice(0, length - start)
      .split('')
      .forEach((digit, offset) => {
        next[start + offset] = digit
      })
    onChange(next.join(''))
    focus(start + text.length)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (digits[index]) setDigit(index, '')
      else if (index > 0) {
        setDigit(index - 1, '')
        focus(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focus(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focus(index + 1)
    }
  }

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return
    event.preventDefault()
    fill(index, pasted)
  }

  return (
    <div role="group" aria-label="Verification code" className="flex w-full items-center gap-3.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element
          }}
          value={digit}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="\d*"
          maxLength={length}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-16 w-full min-w-0 flex-1 rounded-control bg-surface-raised p-2.5 text-center sm:h-otp',
            'text-otp font-bold text-grey-50 caret-brand-orange shadow-otp outline-none selection:bg-transparent dark:text-white',
            'focus:ring-2 focus:ring-brand-orange-glow disabled:opacity-60',
            invalid && 'ring-2 ring-red-500',
          )}
        />
      ))}
    </div>
  )
}
