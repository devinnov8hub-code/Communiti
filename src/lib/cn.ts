import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge about our custom font-size tokens so they don't
// get mistaken for text colors (and vice versa) when merging classes.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['head2', 'title-sm', 'h3', 'h4', 'otp', 'body-l', 'body-m', 'body-s', 'caption', 'xs'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
