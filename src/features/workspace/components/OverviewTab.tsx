import {
  ChatCenteredText,
  Lightbulb,
  PaperPlaneTilt,
  Play,
  PuzzlePiece,
  UserPlus,
  Warning,
  type Icon,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AvatarStack, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { useRequestToJoin } from '../hooks/queries'
import type { ProjectStatus } from '@/features/projects/types'
import type { ProjectWorkspace } from '../types'
import { AcceptTermsModal } from './AcceptTermsModal'

const STATUS: Record<ProjectStatus, { label: string; tone: string }> = {
  open: { label: 'Open', tone: 'bg-brand-green' },
  ongoing: { label: 'Ongoing', tone: 'bg-warning' },
  completed: { label: 'Completed', tone: 'bg-grey-40' },
  archived: { label: 'Archived', tone: 'bg-grey-40' },
}

// The design also has "Impact"; the backend doesn't store it.
const SECTIONS: { key: 'pitch' | 'problem' | 'solution'; label: string; icon: Icon }[] = [
  { key: 'pitch', label: 'Pitch', icon: Lightbulb },
  { key: 'problem', label: 'Problem', icon: Warning },
  { key: 'solution', label: 'Solution', icon: PuzzlePiece },
]

/** Project overview (Figma "overview v1"): summary + pitch, and the join flow for non-members. */
export function OverviewTab({ workspace }: { workspace: ProjectWorkspace }) {
  const [accepting, setAccepting] = useState(false)
  const join = useRequestToJoin(workspace.id)
  const toast = useToast()

  return (
    <div className="flex flex-col gap-gap-md">
      {workspace.membership === 'pending' && (
        <div
          role="status"
          className="flex items-start gap-gap-sm rounded-control border border-brand-orange-peach bg-brand-orange-tint px-5 py-2.5"
        >
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brand-orange-cream">
            <PaperPlaneTilt aria-hidden weight="fill" className="size-[18px] text-brand-orange" />
          </span>
          <div className="flex flex-col gap-1 text-body-m">
            <p className="font-semibold text-brand-orange">Your request has been sent</p>
            <p className="text-grey-40">
              An admin will review your request, and you’ll be notified once a decision has been made.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-gap-lg lg:grid-cols-[minmax(0,561fr)_minmax(0,529fr)] lg:gap-[37px]">
        <div className="flex flex-col gap-9">
          <div className="flex flex-col gap-[15px]">
            <div className="flex flex-col gap-gap-sm">
              <h1 className="text-h3 font-bold text-fg">{workspace.title}</h1>
              <p className="text-body-l text-fg-subtle">{workspace.ownerName}</p>
            </div>
            <div className="flex items-center gap-2">
              <AvatarStack people={workspace.members} />
              <span className="text-body-m text-fg-subtle">
                {workspace.membersCount} {workspace.membersCount === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-x-[31px] gap-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-body-m text-fg">Project Status :</span>
                <span
                  className={cn('rounded-full px-2.5 py-1.5 text-body-s text-white', STATUS[workspace.status].tone)}
                >
                  {STATUS[workspace.status].label}
                </span>
              </div>
              {workspace.conversationId && (
                <Link
                  to={paths.chat(workspace.conversationId)}
                  className="flex items-center gap-1.5 rounded-card border border-brand-orange bg-linear-[188deg] from-white from-16% to-brand-orange to-[287%] px-2.5 py-1.5 text-body-m text-brand-orange transition hover:brightness-[0.98]"
                >
                  <ChatCenteredText aria-hidden className="size-5" />
                  Messages
                </Link>
              )}
            </div>
          </div>
          <ProjectVideo workspace={workspace} />
        </div>

        <ul className="flex flex-col gap-gap-md">
          {SECTIONS.map(({ key, label, icon: SectionIcon }) => (
            <li key={key} className="flex items-start gap-2 border-b border-hairline py-2.5 last:border-b-0">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-orange-tint">
                <SectionIcon aria-hidden className="size-7 text-brand-orange" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
                <h2 className="text-body-m font-semibold text-brand-orange">{label}</h2>
                <p className="text-body-s text-grey-40 dark:text-fg-body">{workspace[key]}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {workspace.membership === 'none' && (
        <div className="pointer-events-none sticky bottom-6 flex justify-end">
          <button
            type="button"
            onClick={() => setAccepting(true)}
            className="pointer-events-auto flex h-14 items-center gap-2.5 rounded-full bg-brand-orange px-8 text-body-l font-semibold text-white shadow-popover transition hover:brightness-95 sm:h-16 sm:px-12"
          >
            Join Project
            <UserPlus aria-hidden className="size-6" />
          </button>
        </div>
      )}

      {accepting && (
        <AcceptTermsModal
          workspace={workspace}
          loading={join.isPending}
          error={join.isError ? getErrorMessage(join.error) : undefined}
          onClose={() => {
            join.reset()
            setAccepting(false)
          }}
          onAgree={() =>
            join.mutate(undefined, {
              onSuccess: () => {
                setAccepting(false)
                toast('Request sent — an admin will review it')
              },
            })
          }
        />
      )}
    </div>
  )
}

/** Pitch video (Figma "video"): cover with a play button; just the cover when there is no video. */
function ProjectVideo({ workspace }: { workspace: ProjectWorkspace }) {
  const [playing, setPlaying] = useState(false)

  if (!workspace.videoUrl) {
    return workspace.coverUrl ? (
      <img src={workspace.coverUrl} alt="" className="aspect-[561/380] w-full bg-grey-30 object-cover" />
    ) : null
  }

  if (playing) {
    return (
      <video
        src={workspace.videoUrl}
        poster={workspace.coverUrl}
        controls
        autoPlay
        className="aspect-[561/380] w-full bg-black object-cover"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${workspace.title} pitch video`}
      className="group relative flex aspect-[561/380] w-full items-center justify-center overflow-hidden bg-grey-30"
    >
      {workspace.coverUrl && (
        <img src={workspace.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      <span aria-hidden className="absolute inset-0 bg-black/20" />
      <span className="relative flex h-[81px] w-[90px] items-center justify-center rounded-card bg-white/80 transition group-hover:bg-white/90 sm:h-[81px] sm:w-[90px]">
        <Play weight="fill" className="size-10 text-grey-40" />
      </span>
    </button>
  )
}
