import { formatLongDate } from '@/lib/format'
import type { ProjectWorkspace } from '../types'
import { ContractTerms } from './ContractTerms'

/** The project's work contract (Figma "Contracts"). */
export function ContractTab({ workspace }: { workspace: ProjectWorkspace }) {
  const { contract } = workspace
  return (
    <article className="flex max-w-[1000px] flex-col gap-gap-md pt-2">
      <header className="flex flex-col gap-3">
        <h2 className="text-body-m font-semibold text-fg">Work Contract</h2>
        <div className="flex flex-col gap-2 text-caption text-grey-40 dark:text-fg-body">
          <p>Created {formatLongDate(contract.createdAt)}</p>
          <p>Updated {formatLongDate(contract.updatedAt)}</p>
        </div>
      </header>
      <ContractTerms contract={contract} />
    </article>
  )
}
