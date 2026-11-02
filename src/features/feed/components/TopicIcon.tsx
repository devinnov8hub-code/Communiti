import { Hash } from '@phosphor-icons/react'
import agricultureIcon from '@/assets/topics/agriculture.svg'
import educationIcon from '@/assets/topics/education.svg'
import sustainabilityIcon from '@/assets/topics/sustainability.svg'
import { cn } from '@/lib/cn'

// The backend's topics have no artwork: these are the ones the design has, by slug.
const ICONS: Record<string, string> = {
  agriculture: agricultureIcon,
  sustainability: sustainabilityIcon,
  education: educationIcon,
}

const TONES = ['bg-brand-green-tint', 'bg-info-tint', 'bg-brand-orange-tint']

/** Round tinted topic badge; `index` is the topic's place in its list, which picks the tint. */
export function TopicIcon({ slug, index }: { slug: string; index: number }) {
  const icon = ICONS[slug]
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full p-[3px]',
        TONES[index % TONES.length],
      )}
    >
      {icon ? (
        <img src={icon} alt="" width={22} height={22} className="size-[22px]" />
      ) : (
        <Hash aria-hidden className="size-[22px] text-fg" />
      )}
    </span>
  )
}
