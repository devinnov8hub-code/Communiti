import { ArrowLeft, Cube, FileText, type Icon } from '@phosphor-icons/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Modal, Spinner, StarRating, TextAreaField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { timeAgo } from '@/lib/format'
import { useCreateEvaluation, usePrototypes, useResearch, useVersions } from '../hooks/queries'
import { EVALUATION_CRITERIA, type EvaluationScores, type EvaluationTarget, type Prototype } from '../types'
import { ModalActions, TabState } from './shared'

type Step =
  | { name: 'kind' }
  | { name: 'document' }
  | { name: 'prototype' }
  | { name: 'version'; prototype: Prototype }
  | { name: 'form'; target: EvaluationTarget }

const TITLES: Record<Step['name'], string> = {
  kind: 'Add evaluation',
  document: 'Select Document',
  prototype: 'Select Prototype',
  version: 'Select Version',
  form: 'Add Evaluation',
}

const shortDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })

/**
 * Expert evaluation flow (Figma "Expert modal" → "select document" / "select prototype"
 * → "Select version" → "add evaluation").
 */
export function AddEvaluationModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [history, setHistory] = useState<Step[]>([{ name: 'kind' }])
  const step = history[history.length - 1]
  const go = (next: Step) => setHistory((current) => [...current, next])
  const back = () => setHistory((current) => current.slice(0, -1))

  return (
    <Modal open onClose={onClose} title={TITLES[step.name]} gap="sm" className="max-w-[458px] [&_h2]:text-body-l">
      {history.length > 1 && (
        <button
          type="button"
          onClick={back}
          className="-mt-1 flex items-center gap-1 self-start text-body-s text-grey-40 hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back
        </button>
      )}
      {step.name === 'kind' && (
        <ul className="flex flex-col">
          <KindOption
            icon={FileText}
            tone="info"
            title="Research"
            description="Review research documents"
            onSelect={() => go({ name: 'document' })}
          />
          <KindOption
            icon={Cube}
            tone="orange"
            title="Prototype"
            description="Review prototype versions"
            onSelect={() => go({ name: 'prototype' })}
          />
        </ul>
      )}
      {step.name === 'document' && (
        <DocumentPicker
          projectId={projectId}
          onSelect={(doc) => go({ name: 'form', target: { kind: 'research', id: doc.id, label: doc.title } })}
        />
      )}
      {step.name === 'prototype' && (
        <PrototypePicker projectId={projectId} onSelect={(prototype) => go({ name: 'version', prototype })} />
      )}
      {step.name === 'version' && (
        <VersionPicker
          projectId={projectId}
          prototype={step.prototype}
          onSelect={(target) => go({ name: 'form', target })}
        />
      )}
      {step.name === 'form' && <EvaluationForm projectId={projectId} target={step.target} onClose={onClose} />}
    </Modal>
  )
}

function KindOption({
  icon: KindIcon,
  tone,
  title,
  description,
  onSelect,
}: {
  icon: Icon
  tone: 'info' | 'orange'
  title: string
  description: string
  onSelect: () => void
}) {
  return (
    <li className="border-b border-hairline last:border-b-0">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-2 py-4 text-left hover:opacity-80"
      >
        <span
          className={
            tone === 'info'
              ? 'flex size-[26px] items-center justify-center rounded-full bg-info-tint text-info'
              : 'flex size-[26px] items-center justify-center rounded-full bg-brand-orange-tint text-brand-orange'
          }
        >
          <KindIcon aria-hidden weight="fill" className="size-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-body-s font-semibold text-fg">{title}</span>
          <span className="text-caption text-grey-40 dark:text-fg-body">{description}</span>
        </span>
      </button>
    </li>
  )
}

function PickerList({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean
  error: Error | null
  empty: boolean
  children: ReactNode
}) {
  if (loading)
    return (
      <TabState>
        <Spinner className="text-brand-orange" />
      </TabState>
    )
  if (error) return <TabState>{getErrorMessage(error)}</TabState>
  if (empty) return <TabState>Nothing to review yet.</TabState>
  return <ul className="flex flex-col">{children}</ul>
}

function PickerRow({
  imageUrl,
  title,
  subtitle,
  onSelect,
}: {
  imageUrl?: string
  title: string
  subtitle: string
  onSelect: () => void
}) {
  return (
    <li className="border-b border-hairline last:border-b-0">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-1 py-2 text-left hover:bg-fg/[0.03]"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-[29px] w-[30px] shrink-0 bg-white object-cover" />
        ) : (
          <span aria-hidden className="h-[29px] w-[30px] shrink-0 bg-grey-30" />
        )}
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-caption text-fg">{title}</span>
          <span className="text-xs text-grey-40 dark:text-fg-body">{subtitle}</span>
        </span>
      </button>
    </li>
  )
}

function DocumentPicker({
  projectId,
  onSelect,
}: {
  projectId: string
  onSelect: (doc: { id: string; title: string }) => void
}) {
  const docs = useResearch(projectId)
  return (
    <PickerList loading={docs.isPending} error={docs.error} empty={docs.data?.length === 0}>
      {docs.data?.map((doc) => (
        <PickerRow
          key={doc.id}
          imageUrl={doc.thumbnailUrl}
          title={doc.title}
          subtitle={`Updated by: ${doc.updatedBy}  ${timeAgo(doc.updatedAt)}`}
          onSelect={() => onSelect(doc)}
        />
      ))}
    </PickerList>
  )
}

function PrototypePicker({ projectId, onSelect }: { projectId: string; onSelect: (prototype: Prototype) => void }) {
  const prototypes = usePrototypes(projectId)
  return (
    <PickerList loading={prototypes.isPending} error={prototypes.error} empty={prototypes.data?.length === 0}>
      {prototypes.data?.map((prototype) => (
        <PickerRow
          key={prototype.id}
          imageUrl={prototype.thumbnailUrl}
          title={prototype.name}
          subtitle={`Created: ${shortDate.format(new Date(prototype.createdAt))}`}
          onSelect={() => onSelect(prototype)}
        />
      ))}
    </PickerList>
  )
}

function VersionPicker({
  projectId,
  prototype,
  onSelect,
}: {
  projectId: string
  prototype: Prototype
  onSelect: (target: EvaluationTarget) => void
}) {
  const versions = useVersions(projectId, prototype.id)
  return (
    <PickerList loading={versions.isPending} error={versions.error} empty={versions.data?.length === 0}>
      {versions.data?.map((version) => (
        <PickerRow
          key={version.id}
          imageUrl={version.imageUrl ?? version.thumbnailUrl}
          title={version.name}
          subtitle={`Updated by: ${version.editedBy.name.split(' ')[0]}  ${timeAgo(version.updatedAt)}`}
          onSelect={() =>
            onSelect({
              kind: 'prototype',
              id: prototype.id,
              label: prototype.name,
              versionId: version.id,
              versionLabel: version.name,
            })
          }
        />
      ))}
    </PickerList>
  )
}

function EvaluationForm({
  projectId,
  target,
  onClose,
}: {
  projectId: string
  target: EvaluationTarget
  onClose: () => void
}) {
  const create = useCreateEvaluation(projectId)
  const toast = useToast()
  const [scores, setScores] = useState<EvaluationScores>({ feasibility: 3, sustainability: 3, novelty: 3 })
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const TargetIcon = target.kind === 'research' ? FileText : Cube

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (comment.trim().length < 10) return setError('Share a little more feedback (10+ characters)')
    create.mutate(
      { target, scores, comment: comment.trim() },
      {
        onSuccess: () => {
          toast('Evaluation uploaded')
          onClose()
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-gap-md">
      <p className="text-caption text-grey-40 dark:text-fg-body">
        Review the project based on your expertise and provide constructive feedback to help guide its development.
      </p>
      <div className="flex items-center gap-1 rounded-sm border border-grey-30 bg-surface px-2 py-2.5 dark:border-hairline">
        <TargetIcon aria-hidden className="size-4 shrink-0 text-brand-orange" />
        <div className="flex min-w-0 flex-col gap-0.5 text-caption">
          <span className="truncate text-brand-orange">{target.label}</span>
          {target.kind === 'prototype' && <span className="text-fg">{target.versionLabel}</span>}
        </div>
      </div>
      <fieldset className="flex flex-col gap-gap-md">
        <legend className="sr-only">Scores</legend>
        {EVALUATION_CRITERIA.map((criterion) => (
          <div key={criterion.key} className="flex items-center justify-between gap-3">
            <span className="text-body-m text-fg">{criterion.label}</span>
            <StarRating
              size="md"
              label={criterion.label}
              value={scores[criterion.key]}
              onChange={(value) => setScores((current) => ({ ...current, [criterion.key]: value }))}
            />
          </div>
        ))}
      </fieldset>
      <TextAreaField
        label="What’s your evaluation?"
        placeholder="write something..."
        value={comment}
        onChange={(event) => {
          setComment(event.target.value)
          setError(undefined)
        }}
        error={error}
      />
      <ModalActions confirmLabel="Upload Evaluation" onCancel={onClose} loading={create.isPending} />
    </form>
  )
}
