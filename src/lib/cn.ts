import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge about our custom design tokens (globals.css @theme) so
// overrides like `h-[38px]` replace `h-control`, and font sizes aren't mistaken
// for text colors (and vice versa) when merging classes.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['control', 'otp', 'gap-sm', 'gap-md', 'gap-lg', 'gap-xl', 'gap-2xl'],
      radius: ['control', 'card', 'modal', 'search'],
      shadow: ['otp', 'popover', 'card'],
    },
    classGroups: {
      'font-size': [{ text: ['head2', 'title-sm', 'h3', 'h4', 'otp', 'body-l', 'body-m', 'body-s', 'caption', 'xs'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
