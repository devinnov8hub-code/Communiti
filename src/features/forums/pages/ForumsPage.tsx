import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState, Tabs } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { ForumFormModal } from '../components/ForumFormModal'
import { ForumCard } from '../components/ForumCard'
import { useForums } from '../hooks/queries'
import type { ForumsTab } from '../types'

const TABS = [
  { value: 'for-you', label: 'For You' },
  { value: 'joined', label: 'Joined' },
  { value: 'mine', label: 'My Forums' },
] as const

const EMPTY: Record<ForumsTab, { title: string; description: string }> = {
  'for-you': { title: 'No forums yet', description: 'Be the first to start one.' },
  joined: { title: 'You haven’t joined any forums', description: 'Join a forum to see it here.' },
  mine: { title: 'You haven’t created a forum', description: 'Use the + button to create one.' },
}

/** Forums list (Figma "Forumns"). */
export function ForumsPage() {
  const [tab, setTab] = useState<ForumsTab>('for-you')
  const [creating, setCreating] = useState(false)
  const forums = useForums(tab)

  return (
    <PageColumns aside={<RightRail />} className="flex min-h-[calc(100dvh-56px)] flex-col md:min-h-dvh">
      <SearchHeader>
        <Tabs label="Forums" items={TABS} value={tab} onChange={setTab} />
      </SearchHeader>

      <div className="flex flex-1 flex-col gap-1 pb-28">
        {forums.isPending ? (
          <div className="h-[420px] animate-pulse bg-surface" />
        ) : forums.data?.length ? (
          forums.data.map((forum) => <ForumCard key={forum.id} forum={forum} />)
        ) : (
          <EmptyState {...EMPTY[tab]} />
        )}
      </div>

      {/* Floating create button (Figma "Frame 3366"), pinned to the bottom of the column. */}
      <div className="pointer-events-none sticky bottom-6 flex justify-end px-6">
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label="Create a forum"
          className="pointer-events-auto flex size-8 items-center justify-center rounded-full bg-brand-orange text-white shadow-popover transition hover:brightness-95"
        >
          <Plus className="size-8" />
        </button>
      </div>

      {creating && <ForumFormModal onClose={() => setCreating(false)} />}
    </PageColumns>
  )
}
