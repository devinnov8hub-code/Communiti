import { useCallback } from 'react'
import { paths } from '@/app/paths'
import { useToast } from '@/components/ui'

/** Uses the native share sheet when available, otherwise copies the post link. */
export function useSharePost() {
  const toast = useToast()

  return useCallback(
    async (postId: string, text?: string) => {
      const url = `${window.location.origin}${paths.post(postId)}`
      try {
        if (navigator.share) {
          await navigator.share({ title: 'CommUniti', text: text?.slice(0, 120), url })
          return
        }
        await navigator.clipboard.writeText(url)
        toast('Link copied to clipboard')
      } catch (error) {
        // The user dismissing the share sheet is not an error.
        if ((error as DOMException)?.name !== 'AbortError') toast('Couldn’t share this post')
      }
    },
    [toast],
  )
}
