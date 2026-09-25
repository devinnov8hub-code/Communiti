import { Image as ImageIcon, PencilSimpleLine, PlugsConnected, Plus, Trash } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { IconButton, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { useRemoveExperience } from '../hooks/queries'
import type { Experience, Profile } from '../types'

const LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
  'on-site': 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

const monthYear = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', year: 'numeric' })

function duration(startIso: string, endIso?: string) {
  const start = new Date(startIso)
  const end = endIso ? new Date(endIso) : new Date()
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth())
  return months >= 12 && months % 12 === 0
    ? `${months / 12} yr${months === 12 ? '' : 's'}`
    : `${months} month${months === 1 ? '' : 's'}`
}

interface AboutTabProps {
  profile: Profile
  onEditSkills: () => void
  onAddExperience: () => void
}

/** Profile "About": counts, skills and work experience (Figma "Profile About"). */
export function AboutTab({ profile, onEditSkills, onAddExperience }: AboutTabProps) {
  return (
    <div className="flex flex-col items-center gap-gap-sm pt-2.5">
      <Section>
        <div className="flex items-center justify-center gap-gap-md">
          <Stat icon={<ImageIcon className="size-6" />} value={profile.postsCount} label="Posts" />
          <span aria-hidden className="h-[33px] w-px bg-hairline" />
          <Stat icon={<PlugsConnected className="size-6" />} value={profile.projectsCount} label="Projects" />
        </div>
      </Section>

      <Section
        title="Skills"
        action={
          <IconButton label="Edit skills" onClick={onEditSkills} className="size-8 text-fg">
            <PencilSimpleLine className="size-6" />
          </IconButton>
        }
      >
        {profile.skills.length ? (
          <ul className="flex flex-wrap gap-x-[17px] gap-y-2">
            {profile.skills.map((skill) => (
              <li key={skill} className="rounded-search bg-surface px-2 py-[5px] text-caption text-fg">
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-s text-fg-muted">Add skills so collaborators can find you.</p>
        )}
      </Section>

      <Section
        title="Experience"
        action={
          <IconButton label="Add experience" onClick={onAddExperience} className="size-8 text-fg">
            <Plus className="size-6" />
          </IconButton>
        }
      >
        {profile.experiences.length ? (
          <ul className="flex flex-col">
            {profile.experiences.map((experience) => (
              <ExperienceItem key={experience.id} experience={experience} />
            ))}
          </ul>
        ) : (
          <p className="text-body-s text-fg-muted">No work experience added yet.</p>
        )}
      </Section>
    </div>
  )
}

function Section({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-1.5 border-b border-hairline px-3 py-2.5">
      {title && (
        <header className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-fg">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex w-[74px] flex-col items-center text-center text-body-s text-grey-50 dark:text-grey-30">
      <span className="text-fg">{icon}</span>
      <span>{value}</span>
      <span>{label}</span>
    </div>
  )
}

function ExperienceItem({ experience }: { experience: Experience }) {
  const remove = useRemoveExperience()
  const toast = useToast()
  const initials = experience.company
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  return (
    <li className="group flex items-start gap-[5px] border-b border-hairline px-5 py-2.5 last:border-b-0">
      <span className="flex h-[42px] w-[47px] shrink-0 items-center justify-center bg-brand-green-tint p-2.5 text-body-l font-semibold text-brand-green">
        {initials}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-m text-fg">{experience.title}</p>
        <p className="text-caption text-fg-muted">
          {experience.company} - {LABELS[experience.employmentType]}
        </p>
        <p className="text-caption text-fg-muted">
          {monthYear(experience.startDate)} - {experience.endDate ? monthYear(experience.endDate) : 'Present'}{' '}
          {duration(experience.startDate, experience.endDate)}
        </p>
        <p className="text-caption text-fg-muted">
          {[experience.location, LABELS[experience.jobType]].filter(Boolean).join(' - ')}
        </p>
      </div>
      <IconButton
        label={`Remove ${experience.title}`}
        disabled={remove.isPending}
        onClick={() =>
          remove.mutate(experience.id, {
            onSuccess: () => toast('Experience removed'),
            onError: (error) => toast(getErrorMessage(error)),
          })
        }
        className="size-8 text-fg-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash className="size-5" />
      </IconButton>
    </li>
  )
}
