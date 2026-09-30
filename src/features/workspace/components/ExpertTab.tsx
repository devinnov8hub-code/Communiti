import { Cube, DotsThree, FileText, Question } from '@phosphor-icons/react'
import { useState } from 'react'
import { Avatar, IconButton, Menu, MenuItem, Spinner, StarRating, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { useEvaluations } from '../hooks/queries'
import { EVALUATION_CRITERIA, type Evaluation } from '../types'
import { AddEvaluationModal } from './AddEvaluationModal'
import { TabState, WorkspaceAction } from './shared'

/** Expert evaluations and the overall review score (Figma "Expert"). */
export function ExpertTab({ projectId }: { projectId: string }) {
  const evaluations = useEvaluations(projectId)
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-gap-sm">
      <WorkspaceAction onClick={() => setAdding(true)}>Add Evaluation</WorkspaceAction>

      {evaluations.isPending ? (
        <TabState>
          <Spinner className="text-brand-orange" />
        </TabState>
      ) : evaluations.isError ? (
        <TabState>{getErrorMessage(evaluations.error)}</TabState>
      ) : (
        <div className="flex flex-col gap-3 lg:px-[50px]">
          <p className="flex min-h-[27px] items-center justify-center gap-1.5 rounded-sm bg-brand-orange-peach px-3 py-1 text-center text-body-s text-grey-50">
            <Question aria-hidden weight="fill" className="size-4 shrink-0" />
            Total evaluation review score: {evaluations.data.score}/100
          </p>
          {evaluations.data.evaluations.length === 0 ? (
            <TabState>No evaluations yet. Experts’ reviews will appear here.</TabState>
          ) : (
            <ul className="flex flex-col gap-3">
              {evaluations.data.evaluations.map((evaluation) => (
                <EvaluationCard key={evaluation.id} evaluation={evaluation} />
              ))}
            </ul>
          )}
        </div>
      )}

      {adding && <AddEvaluationModal projectId={projectId} onClose={() => setAdding(false)} />}
    </div>
  )
}

function EvaluationCard({ evaluation }: { evaluation: Evaluation }) {
  const toast = useToast()
  const { target } = evaluation
  const TargetIcon = target.kind === 'research' ? FileText : Cube

  return (
    <li className="flex flex-col gap-3 bg-surface-raised px-5 pt-2.5 pb-gap-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar src={evaluation.author.avatarUrl} name={evaluation.author.name} size={31} />
          <p className="truncate text-body-s text-fg">{evaluation.author.name}</p>
        </div>
        <Menu
          trigger={
            <IconButton label={`Actions for ${evaluation.author.name}’s evaluation`} className="size-7 text-fg">
              <DotsThree weight="bold" className="size-6" />
            </IconButton>
          }
          className="w-[200px]"
        >
          {(close) => (
            <MenuItem
              size="sm"
              tone="warning"
              onSelect={() => {
                close()
                toast('Thanks — an admin will review this evaluation')
              }}
            >
              Flag evaluation
            </MenuItem>
          )}
        </Menu>
      </div>
      <p className="text-body-s text-grey-40 dark:text-fg-body">{evaluation.comment}</p>
      <p className="flex items-center gap-1 rounded-control border border-grey-30 bg-offwhite p-2.5 text-caption text-black dark:border-hairline dark:bg-grey-50 dark:text-fg">
        <TargetIcon aria-hidden className="size-[18px] shrink-0 text-info" />
        <span className="min-w-0 flex-1 truncate">
          {target.label}
          {target.kind === 'prototype' && <span className="text-grey-40"> · {target.versionLabel}</span>}
        </span>
      </p>
      <dl className="flex flex-col gap-[7px]">
        {EVALUATION_CRITERIA.map((criterion) => (
          <div key={criterion.key} className="flex items-center justify-between gap-3">
            <dt className="text-body-m text-fg">{criterion.label}</dt>
            <dd>
              <StarRating value={evaluation.scores[criterion.key]} label={criterion.label} />
            </dd>
          </div>
        ))}
      </dl>
    </li>
  )
}
