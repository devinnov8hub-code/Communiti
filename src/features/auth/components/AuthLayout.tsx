import type { ReactNode } from 'react'
import heroEllipse from '@/assets/auth/hero-ellipse.svg'
import heroMentor from '@/assets/auth/hero-mentor.webp'
import heroTeam from '@/assets/auth/hero-team.webp'
import { cn } from '@/lib/cn'

const HERO_IMAGES = {
  team: heroTeam,
  mentor: heroMentor,
} as const

export type AuthHeroImage = keyof typeof HERO_IMAGES

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

function AuthHero({ image }: { image: AuthHeroImage }) {
  return (
    <aside aria-hidden className="sticky top-0 hidden h-dvh w-[34%] max-w-[512px] shrink-0 overflow-hidden lg:block">
      <img
        src={HERO_IMAGES[image]}
        alt=""
        // Figma offsets the photo frame by -13px, cropping a light strip at the top.
        className="absolute top-[-13px] left-0 h-[calc(100%+13px)] w-full object-cover object-[66%_50%]"
      />
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
