import { useEffect, useRef } from 'react'

/**
 * Placeholder row at the end of a paged list that calls `onVisible` when it scrolls into view.
 * Re-key it per page (e.g. by the item count) so it fires again if it is still visible after a page loads.
 */
export function LoadMore({ onVisible, className = 'h-16' }: { onVisible: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const callback = useRef(onVisible)

  useEffect(() => {
    callback.current = onVisible
  })

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && callback.current(), {
      rootMargin: '200px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} aria-hidden className={`${className} animate-pulse bg-surface/50`} />
}
