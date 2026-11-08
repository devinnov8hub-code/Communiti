import { cn } from '@/lib/cn'
import { COLLABORATION_TERMS } from '../terms'

/** Intro + numbered collaboration terms, shared by the Contract tab and the Accept Terms dialog. */
export function ContractTerms({ numbered, className }: { numbered?: boolean; className?: string }) {
  const List = numbered ? 'ol' : 'ul'
  return (
    <div className={cn('flex flex-col gap-gap-md text-body-s text-fg', className)}>
      <p>{COLLABORATION_TERMS.intro}</p>
      <List className={cn('flex flex-col', numbered ? 'list-decimal gap-1 pl-5' : 'gap-0.5')}>
        {COLLABORATION_TERMS.terms.map((term) => (
          <li key={term.title}>
            {term.title} — {term.body}
          </li>
        ))}
      </List>
    </div>
  )
}
