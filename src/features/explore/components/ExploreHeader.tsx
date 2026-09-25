import { useNavigate } from 'react-router-dom'
import { Tabs } from '@/components/ui'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import type { ExploreTab } from '../types'
import { exploreTabUrl } from '../urls'

const TABS = [
  { value: 'suggested', label: 'Suggested for you' },
  { value: 'highlights', label: 'Community Highlights' },
  { value: 'featured', label: 'Featured Innovation' },
] as const

/** Search + Explore tabs. Detail pages keep the parent tab highlighted. */
export function ExploreHeader({ tab, onChange }: { tab: ExploreTab; onChange?: (tab: ExploreTab) => void }) {
  const navigate = useNavigate()
  return (
    <SearchHeader>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Tabs
          label="Explore"
          items={TABS}
          value={tab}
          onChange={(next) => (onChange ? onChange(next) : navigate(exploreTabUrl(next)))}
          className="min-w-[520px]"
        />
      </div>
    </SearchHeader>
  )
}
