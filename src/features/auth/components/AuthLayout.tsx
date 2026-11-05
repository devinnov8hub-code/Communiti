import { useEffect, useState, type ReactNode } from 'react'
import heroEllipse from '@/assets/auth/hero-ellipse.svg'
import heroMentor from '@/assets/auth/hero-mentor.webp'
import heroTeam from '@/assets/auth/hero-team.webp'
import { cn } from '@/lib/cn'

const HERO_IMAGES = {
  team: heroTeam,
  mentor: heroMentor,
} as const

export type AuthHeroImage = keyof typeof HERO_IMAGES

/**
 * Event photos that rotate in after the two hero photos, in this order.
 * To remove a photo, delete its line. To add one, put the file in src/assets/
 * and add a line with its path. Paths must be written out in full like these.
 */
const EVENT_PHOTO_FILES = [
  'mock/explore/highlight-1.webp',
  'mock/explore/highlight-2.webp',
  'mock/explore/highlight-5.webp',
  'mock/explore/highlight-6.webp',
  'mock/explore/highlight-8.webp',
  'mock/explore/highlight-10.webp',
  'mock/explore/highlight-12.webp',
  'mock/explore/highlight-14.webp',
]

// Maps every image under src/assets to its URL. This only collects addresses;
// no photo is downloaded until the slideshow is about to show it.
const ASSET_URLS = import.meta.glob<string>('/src/assets/**/*.{webp,jpg,jpeg,png}', {
  eager: true,
  import: 'default',
})

const EVENT_PHOTOS = EVENT_PHOTO_FILES.map((file) => ASSET_URLS[`/src/assets/${file}`]).filter(Boolean)

const HERO_COPY =
  'Connect with innovators, researchers, and investors who are turning ideas into meaningful impact. Discover opportunities to collaborate, share knowledge, and build solutions that shape the future.'

interface AuthLayoutProps {
  hero: AuthHeroImage
  children: ReactNode
  className?: string
}

/**
 * Split auth layout: photo panel on the left (desktop only), form on the right.
 * Proportions follow the 1512px Figma frame (512px panel, 590px form column).
 */
export function AuthLayout({ hero, children, className }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-background">
      <AuthHero image={hero} />
      <main className="flex flex-1 items-center px-5 py-10 sm:px-10 sm:py-12">
        <div
          className={cn(
            'mx-auto w-full max-w-auth-form',
            // Desktop: sit slightly right of centre, matching the design.
            'lg:mr-auto lg:ml-[clamp(0px,calc(50%-244px),216px)]',
            className,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  )
}

const SLIDE_INTERVAL_MS = 6000

/** The screen's own photo first, then the other hero photo, then the event photos. */
function slidesFor(image: AuthHeroImage) {
  const others = (Object.keys(HERO_IMAGES) as AuthHeroImage[]).filter((key) => key !== image)
  return [HERO_IMAGES[image], ...others.map((key) => HERO_IMAGES[key]), ...EVENT_PHOTOS]
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function AuthHero({ image }: { image: AuthHeroImage }) {
  const [slides] = useState(() => slidesFor(image))
  const [active, setActive] = useState(0)
  // How many slides are mounted: everything shown so far plus the next one, so
  // each photo downloads one interval ahead instead of all at once.
  const [mounted, setMounted] = useState(2)
  const reducedMotion = usePrefersReducedMotion()
  const previous = (active - 1 + slides.length) % slides.length

  useEffect(() => {
    if (reducedMotion || slides.length < 2) return
    const timer = window.setInterval(() => {
      setActive((index) => {
        const next = (index + 1) % slides.length
        setMounted((count) => Math.max(count, next + 2))
        return next
      })
    }, SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [reducedMotion, slides.length])

  return (
    <aside aria-hidden className="sticky top-0 hidden h-dvh w-[34%] max-w-[512px] shrink-0 overflow-hidden lg:block">
      {slides.slice(0, mounted).map((src, index) => (
        <img
          key={src}
          src={src}
          decoding="async"
          alt=""
          // Figma offsets the photo frame by -13px, cropping a light strip at the top.
          className={cn(
            'absolute top-[-13px] left-0 h-[calc(100%+13px)] w-full object-cover object-[66%_50%]',
            'transition-opacity duration-1000 ease-in-out motion-reduce:animate-none motion-reduce:transition-none',
            index === active ? 'opacity-100' : 'opacity-0',
            // The zoom restarts each time a photo comes in, and the outgoing photo
            // keeps its zoomed-in frame while it fades so it doesn't snap back.
            (index === active || index === previous) && 'animate-hero-zoom',
          )}
        />
      ))}
      <img
        src={heroEllipse}
        alt=""
        width={748}
        height={748}
        className="absolute top-[46.4%] left-[-8.8%] aspect-square w-[146%] max-w-none"
      />
      <p className="absolute top-[76.8%] right-[5.5%] left-[5.66%] -translate-y-1/2 text-body-l font-semibold text-white xl:text-h3">
        {HERO_COPY}
      </p>
    </aside>
  )
}
