import { DownloadSimple, FileText } from '@phosphor-icons/react'
import { Spinner, Tag, type TagTone } from '@/components/ui'
import type { Contract } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { formatLongDate } from '@/lib/format'
import { useContracts } from '../hooks/queries'
import { ContractTerms } from './ContractTerms'

const STATUS: Record<Contract['status'], { label: string; tone: TagTone }> = {
  draft: { label: 'Draft', tone: 'info' },
  sent: { label: 'Sent', tone: 'warning' },
  signed: { label: 'Signed', tone: 'success' },
  void: { label: 'Void', tone: 'orange' },
}

/** The collaboration terms and the project's contract files (Figma "Contracts"). */
export function ContractTab({ projectId }: { projectId: string }) {
  const contracts = useContracts(projectId)
  return (
    <article className="flex max-w-[1000px] flex-col gap-gap-md pt-2">
      <h2 className="text-body-m font-semibold text-fg">Work Contract</h2>
      <ContractTerms />

      <section aria-labelledby="contract-files" className="flex flex-col gap-3 pt-2">
        <h3 id="contract-files" className="text-body-m font-semibold text-fg">
          Contract documents
        </h3>
        {contracts.isPending ? (
          <div className="flex justify-center py-6 text-brand-orange">
            <Spinner />
          </div>
        ) : contracts.isError ? (
          <p className="text-body-s text-fg-muted">{getErrorMessage(contracts.error)}</p>
        ) : contracts.data.length === 0 ? (
          <p className="text-body-s text-fg-muted">No contract has been uploaded for this project yet.</p>
        ) : (
          <ul className="flex flex-col">
            {contracts.data.map((contract) => (
              <ContractRow key={contract.id} contract={contract} />
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}

function ContractRow({ contract }: { contract: Contract }) {
  const status = STATUS[contract.status]
  return (
    <li className="flex items-start gap-3 border-b border-hairline py-3 last:border-b-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-orange-tint">
        <FileText aria-hidden className="size-5 text-brand-orange" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-body-m text-fg">{contract.title}</p>
          <Tag tone={status.tone} className="text-caption">
            {status.label}
          </Tag>
        </div>
        {contract.description && <p className="text-body-s text-fg-body">{contract.description}</p>}
        <p className="text-caption text-grey-40 dark:text-fg-body">
          Uploaded by {contract.uploadedBy.fullName} · {formatLongDate(contract.createdAt.slice(0, 10))}
          {contract.signedAt && ` · Signed ${formatLongDate(contract.signedAt.slice(0, 10))}`}
        </p>
      </div>
      {contract.file?.url && (
        <a
          href={contract.file.url}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-full border border-brand-orange px-3 py-1.5 text-body-s text-brand-orange transition hover:bg-brand-orange-tint"
        >
          <DownloadSimple aria-hidden className="size-4" />
          Open
        </a>
      )}
    </li>
  )
}
