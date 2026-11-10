import { useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Large photo with the thumbnail strip under it (Figma "Featured View" → "Image Carousel").
 * Used by featured innovations and highlight albums. A single photo shows without the strip.
 */
export function ImageGallery({
  images,
  title,
  imageClassName = 'h-[228px] sm:h-[300px]',
}: {
  images: string[]
  /** For the alt text: "<title> — image 2". */
  title: string
  imageClassName?: string
}) {
  const [active, setActive] = useState(0)
  if (images.length === 0) return null
  const current = Math.min(active, images.length - 1)

  return (
    <>
      <img
        src={images[current]}
        alt={`${title} — image ${current + 1}`}
        className={cn('w-full bg-grey-30 object-cover', imageClassName)}
      />

      {images.length > 1 && (
        <div className="flex flex-col items-center gap-2 rounded-control bg-carousel py-3">
          <div className="flex w-full max-w-[582px] gap-2 overflow-x-auto px-3">
            {images.map((src, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show image ${index + 1}`}
                aria-current={index === current}
                onClick={() => setActive(index)}
                className={cn(
                  'h-[52px] min-w-[72px] flex-1 overflow-hidden rounded-md ring-offset-2 ring-offset-carousel transition',
                  index === current ? 'ring-2 ring-brand-green' : 'opacity-80 hover:opacity-100',
                )}
              >
                <img src={src} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {images.slice(0, 6).map((_, index) => (
              <span
                key={index}
                className={cn('size-1.5 rounded-full', index === current ? 'bg-brand-green' : 'bg-grey-30')}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
