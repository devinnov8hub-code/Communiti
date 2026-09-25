import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'

interface AvatarStackProps {
  people: { id: string; name: string; avatarUrl?: string }[]
  max?: number
  size?: number
  className?: string
}

/** Overlapping avatars (-10px overlap in the design). */
export function AvatarStack({ people, max = 4, size = 30, className }: AvatarStackProps) {
  return (
    <span className={cn('flex items-center', className)}>
      {people.slice(0, max).map((person, index) => (
        <Avatar
          key={person.id}
          src={person.avatarUrl}
          name={person.name}
          size={size}
          className={cn('ring-2 ring-background', index > 0 && '-ml-2.5')}
        />
      ))}
    </span>
  )
}
