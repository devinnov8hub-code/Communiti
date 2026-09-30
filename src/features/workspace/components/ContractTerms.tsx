import { cn } from '@/lib/cn'
import type { ProjectContract } from '../types'

/** Intro + numbered terms, shared by the Contract tab and the Accept Terms dialog. */
export function ContractTerms({
  contract,
  numbered,
  className,
}: {
  contract: ProjectContract
  numbered?: boolean
  className?: string
}) {
  const List = numbered ? 'ol' : 'ul'
  return (
    <div className={cn('flex flex-col gap-gap-md text-body-s text-fg', className)}>
      <p>{contract.intro}</p>
      <List className={cn('flex flex-col', numbered ? 'list-decimal gap-1 pl-5' : 'gap-0.5')}>
        {contract.terms.map((term) => (
          <li key={term.title}>
            {term.title} — {term.body}
          </li>
        ))}
      </List>
    </div>
  )
}
